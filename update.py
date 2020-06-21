import json
import boto3
import hashlib
import random
import string

def send_to_connection(connection_id, data, event):
    gatewayapi = boto3.client("apigatewaymanagementapi",
            endpoint_url = "https://" + event["requestContext"]["domainName"] +
                    "/" + event["requestContext"]["stage"])
    try:
        gatewayapi.post_to_connection(ConnectionId=connection_id,
                Data=json.dumps(data).encode("utf-8"))
    except gatewayapi.exceptions.GoneException:
        print("ERROR: Connection id " + connection_id + " has gone")

def handle_websocket(event, context):
    connection_id = event["requestContext"].get("connectionId")
    print("connection_id " + connection_id)

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table("loveletter-sessions")

    body = json.loads(event["body"])

    param_room = body["room"]
    param_cmd = body["cmd"] if "cmd" in body else None

    try:
        room_data = table.get_item(Key={"room": param_room})["Item"]
    except KeyError:
        return send_to_connection(connection_id, {"ERROR": "ROOM_NOT_FOUND"}, event)

    if "turn" in room_data:
        room_data["turn"] = int(room_data["turn"])
    if "deck" in room_data:
        room_data["deck"] = json.loads(room_data["deck"])

    def get_num_players():
        for i in range(4):
            if "player" + str(i) not in room_data:
                return i
        return 4

    num_players = get_num_players()
    player_states = [None] * num_players
    players_data = []
    player_index = -1
    for i in range(num_players):
        player_id = "player" + str(i)
        player = json.loads(room_data[player_id])
        players_data.append(player)

        player_state_id = "playerstate" + str(i)
        if player_state_id in room_data:
            player_states[i] = json.loads(room_data[player_state_id])

        if player["connectionId"] == connection_id:
            player_index = i

    if player_index == -1:
        return send_to_connection(connection_id, {"ERROR": "NOT_IN_ROOM"}, event)

    card_types = []
    card_types += ["GUARD"] * 5
    card_types += ["PRIEST"] * 2
    card_types += ["BARON"] * 2
    card_types += ["HANDMAID"] * 2
    card_types += ["PRINCE"] * 2
    card_types += ["KING"] * 1
    card_types += ["COUNTESS"] * 1
    card_types += ["PRINCESS"] * 1

    card_value_map = {
        "GUARD": 1,
        "PRIEST": 2,
        "BARON": 3,
        "HANDMAID": 4,
        "PRINCE": 5,
        "KING": 6,
        "COUNTESS": 7,
        "PRINCESS": 8
    }

    rounds_to_win_map = { 2: 7, 3: 5, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4 }
    rounds_to_win = rounds_to_win_map[num_players]

    def send_to_all(data):
        for i in range(num_players):
            send_to_connection(players_data[i]["connectionId"], data, event)

    def get_public_state():
        response = {
            "cmd": "STATE",
            "gamestate": room_data["gamestate"],
            "players": [x["name"] for x in players_data]
        }
        if room_data["gamestate"] == "PLAYING":
            response["round"] = int(room_data["round"])
            response["turn"] = int(room_data["turn"])
            response["playerStates"] = [{"state": x["state"], "wins": x["wins"], "played": x["played"]} for x in player_states]
            response["interaction"] = dict(room_data["interaction"])
        return response

    def add_private_state(player_index, response):
        response["playerId"] = player_index
        if room_data["gamestate"] == "PLAYING":
            hand = [player_states[player_index]["hand"]]
            if "pickup" in player_states[player_index]:
                hand.append(player_states[player_index]["pickup"])
            response["hand"] = hand
            response["humanHand"] = [card_types[x] for x in hand]
            if "interaction" in player_states[player_index]:
                for (k,v) in player_states[player_index]["interaction"].items():
                    response["interaction"][k] = v

    def update_room():
        set_string = "SET deck = :deck, turn = :turn, round = :round, gamestate = :gamestate, interaction = :interaction, callback = :callback"
        lookup = {
            ":deck": json.dumps(room_data["deck"]),
            ":turn": room_data["turn"],
            ":round": room_data["round"],
            ":gamestate": "PLAYING",
            ":interaction": json.dumps(room_data["interaction"]),
            ":callback": json.dumps(room_data["callback"])
        }

        for i in range(num_players):
            set_string += ", playerstate" + str(i) + " = :playerstate" + str(i)
            lookup[":playerstate" + str(i)] = json.dumps(player_states[i])

        table.update_item(
          Key={"room": param_room },
          UpdateExpression=set_string,
          ExpressionAttributeValues=lookup)

    def start_game(is_new_round=False):
        if num_players <= 1:
            return send_to_connection(connection_id, {"ERROR": "NOT_ENOUGH_PLAYERS"}, event)

        cards = [i for i in range(16)]
        random.shuffle(cards)

        #test
        def move_card(index, cardStr):
            found_index = index + [card_types[x] for x in cards[index:]].index(cardStr)
            tmp = cards[found_index]
            cards[found_index] = cards[index]
            cards[index] = tmp

        move_card(0, "COUNTESS")
        move_card(1, "KING")
        move_card(2, "PRINCE")
        move_card(3, "PRINCESS")

        hands = cards[:num_players]
        del cards[:num_players]

        turn = room_data["turn"] if is_new_round else 0  #random.randint(0, num_players - 1)

        room_data["gamestate"] = "PLAYING"
        room_data["deck"] = cards
        room_data["turn"] = turn
        room_data["round"] = (room_data["round"] + 1) if is_new_round else 0
        room_data["interaction"] = {}
        room_data["callback"] = {}

        for i in range(num_players):
            player_states[i] = {"state": "ALIVE", "wins": player_states[i]["wins"] if is_new_round else 0, "hand": hands[i], "played": []}

        first_pickup = cards[0]
        del cards[0]
        player_states[turn]["pickup"] = first_pickup
        update_room()

        response = get_public_state()
        response["cmd"] = "NEXT_ROUND" if is_new_round else "START_GAME"
        send_to_all(response)

        for i in range(num_players):
            pickup = player_states[i]["hand"]
            response = { "cmd": "START_CARD", "playerId": i, "pickup": pickup, "humanHand": [card_types[pickup]] }
            send_to_connection(players_data[i]["connectionId"], response, event)

        response = {"cmd": "YOUR_TURN", "pickup": first_pickup}
        send_to_connection(players_data[turn]["connectionId"], response, event)

    def next_turn():
        potential_winner = None
        alive_count = 0
        for i in range(num_players):
            if player_states[i]["state"] != "DEAD":
                potential_winner = i
                alive_count += 1
        if alive_count == 1:
            return round_completed([potential_winner])

        new_turn = -1
        for step in range(num_players - 1):
            new_turn = (room_data["turn"] + 1 + step) % num_players
            if player_states[new_turn]["state"] == "DEAD":
                new_turn = -1
            else:
                break

        room_data["turn"] = new_turn
        room_data["interaction"] = {}
        player_states[room_data["turn"]]["interaction"] = {}
        if "target" in room_data["interaction"]:
            player_states[room_data["interaction"]["target"]]["interaction"] = {}

        if len(room_data["deck"]) == 1:
            return round_completed(None)

        send_to_all({"cmd": "NEXT_TURN", "turn": new_turn})
        player_states[new_turn]["state"] = "ALIVE" # clear SAFE state

        pickup = room_data["deck"][0]
        del room_data["deck"][0]
        player_states[new_turn]["pickup"] = pickup
        response = {"cmd": "YOUR_TURN", "pickup": pickup}
        add_private_state(new_turn, response)
        send_to_connection(players_data[new_turn]["connectionId"], response, event)

    def round_completed(round_winners):
        final_cards = []
        if round_winners == None:
            round_winners = []
            highest_card = -1
            for i in range(num_players):
                card_value = card_value_map[card_types[player_states[i]["hand"]]]
                if player_states[i]["state"] != "DEAD" and card_value >= highest_card:
                    if card_value > highest_card:
                        round_winners = [i]
                        highest_card = card_value
                    else:
                        round_winners.append(i)

            if len(round_winners) != 1:
                tied = round_winners
                round_winners = []
                highest_total = 0
                for x in tied:
                    total = 0
                    for card in player_states[i]["played"]:
                        total += card_value_map[card_types[card]]
                    if total > highest_total:
                        highest_total = total
                        round_winners = [x]
                    elif total == highest_total:
                        round_winners.append(x)

            final_cards = [state["hand"] for state in player_states]

        game_winners = []
        game_winner = -1
        highest_round_wins = 0
        for x in round_winners:
            player_states[x]["wins"] += 1
            wins = player_states[x]["wins"]
            if wins >= rounds_to_win:
                if wins > highest_round_wins:
                    game_winners = [x]
                    highest_round_wins = wins
                elif wins == highest_round_wins:
                    game_winners.append(x)

        room_data["turn"] = round_winners[random.randint(0, len(round_winners) - 1)]
        room_data["interaction"] = {"state": "ROUND_COMPLETE", "roundWinners": round_winners, "finalCards": final_cards, "hiddenCard": room_data["deck"][0]}
        if len(game_winners) == 1:
            room_data["interaction"]["gameWinner"] = game_winners[0]

        for i in range(num_players):
            msg = get_public_state()
            msg["cmd"] = "ROUND_COMPLETE"
            add_private_state(i, msg)
            send_to_connection(players_data[i]["connectionId"], msg, event)

        update_room()

    def discard_card(player_index, card, played):
        player_states[player_index]["played"].append(card)
        send_to_all({"cmd": "DISCARD", "playerId": player_index, "card": card})
        if card_types[card] == "PRINCESS":
            player_states[player_index]["state"] = "DEAD"

        if played:
            if card == player_states[room_data["turn"]]["hand"]:
                player_states[room_data["turn"]]["hand"] = player_states[room_data["turn"]]["pickup"]
            del player_states[room_data["turn"]]["pickup"]

        elif player_states[player_index]["state"] != "DEAD":
            pickup = room_data["deck"][0]
            del room_data["deck"][0]
            player_states[player_index]["hand"] = pickup
            msg = {"cmd": "PICKUP", "pickup": pickup, "humanCard": card_types[pickup]}
            send_to_connection(players_data[player_index]["connectionId"], msg, event)


    def valid_target(target, allow_self):
        target = int(target)
        if not allow_self and target == player_index:
            return False
        return player_states[target]["state"] == "ALIVE"

    def play_card():
        hand = player_states[player_index]["hand"]
        pickup = player_states[player_index]["pickup"]
        played_card = hand if param_cmd == "PLAY_HAND" else pickup
        other_card = pickup if param_cmd == "PLAY_HAND" else hand
        played_card_str = card_types[played_card]
        other_card_str = card_types[other_card]

        if other_card_str == "COUNTESS":
            if played_card_str == "KING" or played_card_str == "PRINCE":
                return send_to_connection(connection_id, {"ERROR": "MUST_PLAY_COUNTESS"}, event)

        interaction = {"playerId": room_data["turn"], "card": played_card, "humanCard": played_card_str}

        active_player_state = player_states[room_data["turn"]]
        active_player_state["interaction"] = {"otherCard": other_card}
        active_interaction = active_player_state["interaction"]

        any_valid_target = False
        for i in range(num_players):
            if i != room_data["turn"] and player_states[i]["state"] == "ALIVE":
                any_valid_target = True
                break

        if not any_valid_target and ( \
            played_card_str == "GUARD" or \
            played_card_str == "PRIEST" or \
            played_card_str == "BARON" or \
            played_card_str == "KING"):
            discard_card(room_data["turn"], played_card, True)
            interaction["state"] = "CONTINUE"

        elif played_card_str == "GUARD":
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            if "guess" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_GUESS"}, event)
            param_target = int(body["target"])
            param_guess = body["guess"][:10]

            if not valid_target(param_target, False):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            if param_guess == "GUARD":
                return send_to_connection(connection_id, {"ERROR": "CANT_GUESS_GUARD"}, event)

            interaction["target"] = param_target
            interaction["guess"] = param_guess[:10]
            target_state = player_states[param_target]

            target_card = target_state["hand"]

            correct_guess = card_types[target_card] == param_guess
            interaction["result"] = "CORRECT_GUESS" if correct_guess else "INCORRECT_GUESS"
            if correct_guess:
                room_data["callback"] = {"REVEAL": {"kill": param_target}}

            discard_card(room_data["turn"], played_card, True)
            interaction["state"] = "REVEAL"

        elif played_card_str == "PRIEST":
            # Player is allowed to see another player's hand.
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            param_target = int(body["target"])

            if not valid_target(param_target, False):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            interaction["target"] = param_target
            target_state = player_states[param_target]

            revealed_card = target_state["hand"]
            active_interaction["revealedCard"] = revealed_card

            discard_card(room_data["turn"], played_card, True)
            interaction["state"] = "REVEAL"

        elif played_card_str == "BARON":
            # Player will choose another player and privately compare hands. The player with the lower-strength hand is eliminated from the round.
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            param_target = int(body["target"])

            if not valid_target(param_target, False):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            interaction["target"] = param_target
            target_state = player_states[param_target]

            revealed_card = target_state["hand"]

            turn_value = card_value_map[card_types[other_card]]
            reveal_value = card_value_map[card_types[revealed_card]]
            discard_card(room_data["turn"], played_card, True)
            kill_id = None
            if turn_value == reveal_value:
                interaction["result"] = "TIE"
            else:
                kill_id = param_target if turn_value > reveal_value else room_data["turn"]
                discarded = player_states[kill_id]["hand"]
                interaction["result"] = "LOSE"
                interaction["loser"] = kill_id
                interaction["discard"] = discarded
                room_data["callback"] = {"CONTINUE": {"kill": param_target}}

            target_state["interaction"] = {"revealedCard": other_card}
            active_interaction["revealedCard"] = revealed_card
            interaction["state"] = "REVEAL"

        elif played_card_str == "PRINCE":
            # Player can choose any player (including themselves) to discard their hand and draw a new one.
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            param_target = int(body["target"])

            if not valid_target(param_target, True):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            target_state = player_states[param_target]
            interaction["target"] = param_target
            discard_card(room_data["turn"], played_card, True)
            interaction["revealedCard"] = target_state["hand"]
            if param_target != room_data["turn"]:
                room_data["callback"] = {"REVEAL": {"discard": param_target}}
                interaction["state"] = "REVEAL"
            else:
                discard_card(room_data["turn"], other_card, False)
                interaction["state"] = "CONTINUE"

        elif played_card_str == "KING":
            # Player trades hands with any other player.
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            param_target = int(body["target"])

            if not valid_target(param_target, False):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            interaction["target"] = param_target
            target_state = player_states[param_target]

            # discard the KING first
            discard_card(room_data["turn"], played_card, True)
            room_data["callback"] = {"REVEAL": {"swap": True}}

            active_interaction["swappedFor"] = target_state["hand"]
            target_state["interaction"] = {"swappedFor": other_card, "prevCard": target_state["hand"]}
            interaction["state"] = "REVEAL"

        elif played_card_str == "HANDMAID" or \
             played_card_str == "COUNTESS" or \
             played_card_str == "PRINCESS":
            if played_card_str == "HANDMAID":
                player_states[room_data["turn"]]["state"] = "SAFE"
            discard_card(room_data["turn"], played_card, True)
            interaction["state"] = "CONTINUE"

        else:
            return send_to_connection(connection_id, {"ERROR": "INVALID_CARD_STR"}, event)

        room_data["interaction"] = interaction
        for i in range(num_players):
            msg = get_public_state()
            msg["cmd"] = "PLAYED"
            add_private_state(i, msg)
            send_to_connection(players_data[i]["connectionId"], msg, event)
        update_room()

    def handle_callback(callback):
        if "kill" in callback:
            player_states[callback["kill"]]["state"] = "DEAD"
            discard_card(callback["kill"], player_states[callback["kill"]]["hand"], False)

        if "discard" in callback:
            discard_card(callback["discard"], player_states[callback["discard"]]["hand"], False)

        if "swap" in callback:
            active_player = player_states[room_data["turn"]]
            target_player = player_states[room_data["interaction"]["target"]]
            tmp = active_player["hand"]
            active_player["hand"] = target_player["hand"]
            target_player["hand"] = tmp

    def on_reveal():
        if "REVEAL" in room_data["callback"]:
            handle_callback(room_data["callback"]["REVEAL"])

        room_data["interaction"]["state"] = "CONTINUE"

        for i in range(num_players):
            msg = get_public_state()
            msg["cmd"] = "REVEALED"
            add_private_state(i, msg)
            send_to_connection(players_data[i]["connectionId"], msg, event)
        update_room()

    def on_continue():
        if "CONTINUE" in room_data["callback"]:
            handle_callback(room_data["callback"]["CONTINUE"])

        for i in range(num_players):
            msg = get_public_state()
            msg["cmd"] = "END_TURN"
            add_private_state(i, msg)
            send_to_connection(players_data[i]["connectionId"], msg, event)
        next_turn()
        update_room()

    # TODO set False!
    debugging = True
    ## ^^^

    if debugging and param_cmd == "RESTART":
        return start_game()

    if "interaction" in room_data:
        room_data["interaction"] = json.loads(room_data["interaction"])

    if "callback" in room_data:
        room_data["callback"] = json.loads(room_data["callback"])

    # TODO remove debugging only
    if debugging and param_cmd == "FORCE_ROUND_END":
        room_data["deck"] = room_data["deck"][0:2]
        update_room()
        return
    ## ^^^

    if param_cmd == "GET":
        response = get_public_state()
        add_private_state(player_index, response)
        return send_to_connection(connection_id, response, event)

    if "state" in room_data["interaction"]:
        if room_data["interaction"]["state"] == "REVEAL":
            if param_cmd == "REVEAL":
                if player_index == room_data["interaction"]["target"]:
                    on_reveal()
                    return
            return send_to_connection(connection_id, {"ERROR": "WAITING_FOR_INTERACTION"}, event)

        if room_data["interaction"]["state"] == "CONTINUE":
            if param_cmd == "CONTINUE":
                if player_index == room_data["turn"] or player_states[room_data["turn"]]["state"] == "DEAD":
                    on_continue()
                    return
            return send_to_connection(connection_id, {"ERROR": "WAITING_FOR_INTERACTION"}, event)

        if room_data["interaction"]["state"] == "ROUND_COMPLETE":
            if param_cmd == "ROUND_COMPLETE":
                if player_index == room_data["turn"]:
                    start_game(True)
                    return
            return send_to_connection(connection_id, {"ERROR": "WAITING_FOR_INTERACTION"}, event)

    if room_data["gamestate"] == "LOGIN":
        if param_cmd == "START":
            if "connectionId" not in players_data[0]:
                return send_to_connection(connection_id, {"ERROR": "INVALID_ROOM"}, event)
            if connection_id == players_data[0]["connectionId"]:
                return start_game()

    elif room_data["gamestate"] == "PLAYING":
        if player_index == room_data["turn"]:
            if param_cmd == "PLAY_HAND" or param_cmd == "PLAY_PICKUP":
                return play_card()
        else:
            return send_to_connection(connection_id, {"ERROR": "NOT_YOUR_TURN"}, event)

    return send_to_connection(connection_id, {"ERROR": "INVALID_CMD"}, event)

def lambda_handler(event, context):
    handle_websocket(event, context)
    return {
        "statusCode": 200,
        "headers": {},
        "body": "",
        "isBase64Encoded": False
    }
