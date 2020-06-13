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
            response["interaction"] = room_data["interaction"]
        return response

    def add_private_state(player_index, response):
        response["playerId"] = player_index
        if room_data["gamestate"] == "PLAYING":
            hand = [player_states[player_index]["hand"]]
            if room_data["turn"] == player_index:
                hand.append(room_data["deck"][0])
            response["hand"] = hand
            response["humanHand"] = [card_types[x] for x in hand]
            for (k,v) in player_states[player_index]["interaction"]:
                response["interaction"][k] = v

    def update_room():
        set_string = "SET deck = :deck, turn = :turn, round = :round, gamestate = :gamestate, interaction = :interaction"
        lookup = {
            ":deck": json.dumps(room_data["deck"]),
            ":turn": room_data["turn"],
            ":round": room_data["round"],
            ":gamestate": "PLAYING",
            ":interaction": json.dumps(room_data["interaction"])
        }

        for i in range(num_players):
            set_string += ", playerstate" + str(i) + " = :playerstate" + str(i)
            lookup[":playerstate" + str(i)] = json.dumps(player_states[i])

        table.update_item(
          Key={"room": param_room },
          UpdateExpression=set_string,
          ExpressionAttributeValues=lookup)

    def start_game():
        if num_players <= 1:
            return send_to_connection(connection_id, {"ERROR": "NOT_ENOUGH_PLAYERS"}, event)

        cards = [i for i in range(16)]
        random.shuffle(cards)
        hands = cards[:num_players]
        del cards[:num_players]

        turn = random.randint(0, num_players - 1)

        room_data["gamestate"] = "PLAYING"
        room_data["deck"] = cards
        room_data["turn"] = turn
        room_data["round"] = 0
        room_data["interaction"] = {}
        room_data["target"] = -1

        for i in range(num_players):
            player_states[i] = {"state": "ALIVE", "wins": 0, "hand": hands[i], "played": []}
        update_room()

        response = get_public_state()
        response["cmd"] = "START_GAME"
        send_to_all(response)

        for i in range(num_players):
            pickup = player_states[i]["hand"]
            response = { "cmd": "START_CARD", "playerId": i, "pickup": pickup, "humanHand": [card_types[pickup]] }
            send_to_connection(players_data[i]["connectionId"], response, event)

        pickup = cards[0]
        response = {"cmd": "YOUR_TURN", "pickup": pickup}
        add_private_state(turn, response)
        send_to_connection(players_data[turn]["connectionId"], response, event)

    def next_turn():
        potential_winner = None
        alive_count = 0
        for i in range(num_players):
            if player_states[i]["state"] != "DEAD":
                potential_winner = i
                alive_count += 1
        if alive_count == 1:
            return send_to_all({"cmd": "WINNER", "winner": potential_winner})

        new_turn = -1
        for step in range(num_players - 1):
            new_turn = (room_data["turn"] + 1 + step) % num_players
            if player_states[new_turn]["state"] == "DEAD":
                new_turn = -1
            else:
                break

        send_to_all({"cmd": "NEXT_TURN", "turn": new_turn})
        player_states[room_data["turn"]]["interaction"] = {}
        if "target" in room_data["interaction"]:
            player_states[room_data["interaction"]["target"]]["interaction"] = {}
        room_data["turn"] = new_turn
        room_data["interaction"] = {}
        room_data["target"] = -1
        player_states[new_turn]["state"] = "ALIVE" # clear SAFE state

        pickup = room_data["deck"][0]
        response = {"cmd": "YOUR_TURN", "pickup": pickup}
        add_private_state(new_turn, response)
        send_to_connection(players_data[new_turn]["connectionId"], response, event)

    def discard_card(player_index, card):
        player_states[player_index]["played"].append(card)
        send_to_all({"cmd": "DISCARD", "playerId": player_index, "card": card})
        if card_types[card] == "PRINCESS":
            player_states[player_index]["state"] = "DEAD"

        if player_states[player_index]["state"] != "DEAD":
            if card == player_states[player_index]["hand"]:
                pickup = room_data["deck"][0]
                player_states[player_index]["hand"] = pickup
                msg = {"cmd": "PICKUP", "pickup": pickup, "humanCard": card_types[pickup]}
                send_to_connection(players_data[player_index]["connectionId"], msg, event)
            del room_data["deck"][0]

    def valid_target(target, allow_self):
        target = int(target)
        if not allow_self and target == player_index:
            return False
        return player_states[target]["state"] == "ALIVE"

    def play_card():
        hand = player_states[player_index]["hand"]
        pickup = room_data["deck"][0]
        played_card = hand if param_cmd == "PLAY_HAND" else pickup
        other_card = pickup if param_cmd == "PLAY_HAND" else hand
        played_card_str = card_types[played_card]
        other_card_str = card_types[other_card]

        if other_card_str == "COUNTESS":
            if played_card_str == "KING" or played_card_str == "PRINCE":
                return send_to_connection(connection_id, {"ERROR": "MUST_PLAY_COUNTESS"}, event)

        played_msg = {"cmd": "PLAYED", "playerId": room_data["turn"], "card": played_card, "humanCard": played_card_str}

        if played_card_str == "GUARD":
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

            played_msg["target"] = param_target
            played_msg["guess"] = param_guess

            target_card = player_states[param_target]["hand"]

            correct_guess = card_types[target_card] == guess
            played_msg["guess"] = guess
            played_msg["result"] = "CORRECT_GUESS" if correct_guess else "INCORRECT_GUESS"
            if correct_guess:
                player_states[param_target]["state"] = "DEAD"
            send_to_all(played_msg)

            if correct_guess:
                discard_card(param_target, target_card)
            discard_card(room_data["turn"], card)
            played_msg["state"] = "REVEAL"
            room_data["interaction"] = played_msg

        elif played_card_str == "PRIEST":
            # Player is allowed to see another player's hand.
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            param_target = int(body["target"])

            if not valid_target(param_target, False):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            played_msg["target"] = param_target
            send_to_all(played_msg)

            revealed_card = player_states[param_target]["hand"]
            send_to_connection(players_data[room_data["turn"]]["connectionId"], {"cmd": "REVEAL", "revealedCard": revealedCard}, event)
            player_states[room_data["turn"]]["interaction"]["revealedCard"] = revealed_card

            discard_card(room_data["turn"], card)
            played_msg["state"] = "REVEAL"
            room_data["interaction"] = played_msg

        elif played_card_str == "BARON":
            # Player will choose another player and privately compare hands. The player with the lower-strength hand is eliminated from the round.
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            param_target = int(body["target"])

            if not valid_target(param_target, False):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            played_msg["target"] = param_target
            revealed_card = player_states[param_target]["hand"]

            turn_value = card_value_map[card_types[interaction["otherCard"]]]
            reveal_value = card_value_map[card_types[revealed_card]]
            kill_id = None
            if turn_value == reveal_value:
                played_msg["result"] = "TIE"
            else:
                kill_id = param_target if turn_value > reveal_value else room_data["turn"]
                discarded = player_states[kill_id]["hand"]
                played_msg["result"] = "LOSE"
                played_msg["loser"] = kill_id
                played_msg["discard"] = discarded
                player_states[kill_id]["state"] = "DEAD"

            send_to_all(response)

            send_to_connection(players_data[room_data["turn"]]["connectionId"], {"cmd": "REVEAL", "revealedCard": revealedCard}, event)
            player_states[room_data["turn"]]["interaction"]["revealedCard"] = revealed_card
            send_to_connection(players_data[param_target]["connectionId"], {"cmd": "REVEAL", "revealedCard": other_card}, event)
            player_states[param_target]["interaction"]["revealedCard"] = other_card

            if kill_id is not None:
                discard_card(kill_id, discarded)
            discard_card(room_data["turn"], card)
            played_msg["state"] = "REVEAL"
            room_data["interaction"] = played_msg

        elif played_card_str == "PRINCE":
            # Player can choose any player (including themselves) to discard their hand and draw a new one.
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            param_target = int(body["target"])

            if not valid_target(param_target, True):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            played_msg["target"] = param_target
            send_to_all(response)
            discard_card(param_target, player_states[param_target]["hand"])
            discard_card(room_data["turn"], card)
            played_msg["state"] = "REVEAL"
            room_data["interaction"] = played_msg

        elif played_card_str == "KING":
            # Player trades hands with any other player.
            if "target" not in body:
                return send_to_connection(connection_id, {"ERROR": "NO_TARGET"}, event)
            param_target = int(body["target"])

            if not valid_target(param_target, False):
                return send_to_connection(connection_id, {"ERROR": "INVALID_TARGET"}, event)

            played_msg["target"] = param_target
            send_to_all(played_msg)

            # discard the KING first
            discard_card(room_data["turn"], card)
            # then swap
            tmp = player_states[param_target]["hand"]
            player_states[param_target]["hand"] = player_states[room_data["turn"]]["hand"]
            player_states[room_data["turn"]]["hand"] = tmp

            swap = [tmp, player_states[param_target]["hand"]]
            player_states[room_data["turn"]]["interaction"]["swap"] = swap
            send_to_connection(players_data[room_data["turn"]]["connectionId"], {"cmd": "REVEAL", "swap": swap}, event)
            player_states[param_target]["interaction"]["swap"] = swap
            send_to_connection(players_data[param_target]["connectionId"], {"cmd": "REVEAL", "swap": swap}, event)

            played_msg["state"] = "REVEAL"
            room_data["interaction"] = played_msg

        elif played_card_str == "HANDMAID" or \
             played_card_str == "COUNTESS" or \
             played_card_str == "PRINCESS":
            send_to_all(played_msg)
            if played_card_str == "HANDMAID":
                player_states[room_data["turn"]]["state"] = "SAFE"
            discard_card(room_data["turn"], played_card)
            next_turn()

        update_room()

    # TODO remove
    if param_cmd == "RESTART":
        return start_game()
    ## ^^^

    if room_data["interaction"]:
        room_data["interaction"] = json.loads(room_data["interaction"])

    if "state" in room_data["interaction"]:
        if room_data["interaction"]["state"] == "REVEAL":
            if param_cmd == "REVEAL":
                if player_index == room_data["turn"]:
                    room_data["interaction"]["state"] = "CONTINUE"
                    send_to_all({"cmd": "REVEAL"})
                    update_room()
                    return
            return send_to_connection(connection_id, {"ERROR": "WAITING_FOR_INTERACTION"}, event)

    if room_data["interaction"]["state"] == "CONTINUE":
        if param_cmd == "CONTINUE":
            if player_index == room_data["turn"] or player_states[room_data["turn"]]["state"] == "DEAD":
                room_data["interaction"] = {}
                send_to_all({"cmd": "CONTINUE"})
                update_room()
                return
        return send_to_connection(connection_id, {"ERROR": "WAITING_FOR_INTERACTION"}, event)

    if param_cmd == "GET":
        response = get_public_state()
        add_private_state(player_index, response)
        return send_to_connection(connection_id, response, event)

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
