(this["webpackJsonpionic-loveletter"]=this["webpackJsonpionic-loveletter"]||[]).push([[0],{134:function(t,e,n){"use strict";n.r(e),n.d(e,"createSwipeBackGesture",(function(){return a}));var r=n(16),i=(n(28),n(39)),a=function(t,e,n,a,o){var c=t.ownerDocument.defaultView;return Object(i.createGesture)({el:t,gestureName:"goback-swipe",gesturePriority:40,threshold:10,canStart:function(t){return t.startX<=50&&e()},onStart:n,onMove:function(t){var e=t.deltaX/c.innerWidth;a(e)},onEnd:function(t){var e=t.deltaX,n=c.innerWidth,i=e/n,a=t.velocityX,u=n/2,s=a>=0&&(a>.2||t.deltaX>u),l=(s?1-i:i)*n,h=0;if(l>5){var d=l/Math.abs(a);h=Math.min(d,540)}o(s,i<=0?.01:Object(r.h)(0,i,.9999),h)}})}}}]);
//# sourceMappingURL=0.f81d84ae.chunk.js.map