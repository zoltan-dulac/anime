var animeSMIL = new function () {
	
	var els = {},
		REs = {
			sec: /([0-9]+)s/,
			ms: /([0-9]+)ms/
		},
		svgNS = "http://www.w3.org/2000/svg",
		events = {
			begin: document.createEvent('Event'),
			end: document.createEvent('Event')
		};
	
	this.init = function (reinit) {
		if (Modernizr.smil ) {
			// don't use this script -- use native implementation.
			return;
		}
		
		// initialize events
		for (var i in events) {
			events[i].initEvent('animeSMIL:' + i, true, true)
		}
		
		els.animateMotion = document.getElementsByTagName('animateMotion');
		els.animate = document.getElementsByTagName('animate');
		
		for (var i=0; i<els.animateMotion.length; i++) {
			animateMotion(els.animateMotion[i]);
		}
		
		for (var i=0; i<els.animate.length; i++) {
			animate(els.animate[i]);
		}
	};
	
	function getRootSVGEl (el) {
		var i = el;
		
		while (i.nodeName !== 'svg') {
			i = i.parentNode;
			
			if (i.nodeName === 'HTML') {
				return null;
			}
		}
		
		return i;
	}
	
	function getDuration(val) {
		
		if (!val) {
			return 0;
		}
		
		var matchSec = val.match(REs.sec),
			matchMs = val.match(REs.ms);
			
		if (matchMs) {
			return parseFloat(matchMs[1]);
		} else if (matchSec){
			return parseFloat(matchSec[1]) * 1000;
		} else {
			return 0;
		}
	}
	
	function getPath(el) {
		var r, pathEl 
			mpathEl = el.getElementsByTagName('mpath');
		
		if (mpathEl.length) {
			var href = mpathEl[0].getAttribute('xlink:href'),
				id = href.substr(1);
				
				pathEl = document.getElementById(id);
				
				r = anime.path(pathEl);
		} else {
			var rootSVG = getRootSVGEl(el),
				elPath = el.getAttribute('path'),
				pathEl = document.createElementNS(svgNS,"path");
				pathEl.setAttributeNS(null, 'd', elPath);
				
				rootSVG.appendChild(pathEl);
				r = anime.path(pathEl)
			
		}
		
		return r;
	};
	
	function isNumeric(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
	};
	
	function isDuration(s) {
		return s.match(REs.sec) || s.match(REs.ms)
	}
	
	function getStandardConfigs(el) {
		var target = el.parentNode,
			id = el.getAttribute('id'),
			begin = el.getAttribute('begin') || "",
			beginEvent, beginEventTarget,
			i, r = [];
			
			beginList = begin.split(';');
			
			for (i=0; i<beginList.length; i++) {
				var begin = beginList[i];
				console.log(begin);
				if (isDuration(begin)) {
					begin = getDuration(begin);
				} else {
					// otherwise, it's an event.
					beginEvent = begin.split('.');
					
					if (beginEvent.length === 2) {
						beginEventTarget = beginEvent[0];
						beginEvent = beginEvent[1];
					}
					begin = undefined;
				}
				r.push({
					id: id,
				  targets: target,
				  duration: (getDuration(el.getAttribute('dur')) || 0),
				  loop: (el.getAttribute('repeatCount') === 'indefinite'),
				  easing: (el.getAttribute('easing') || 'linear'),
				  delay: (getDuration(el.getAttribute('delay')) || 0),
				  complete: function() { completeEvent(el) },
				  begin: begin,
				  beginEvent: beginEvent,
				  beginEventTarget: beginEventTarget
				});
			}
			
			return r;
	};
	
	/* Events */
	function beginEvent(el) {
		el.dispatchEvent(events.begin);
	}
	
	function completeEvent(el) {
		console.log(el);
		var event = document.createEvent('Event')
		event.initEvent('animeSMIL:end', true, true);
		el.dispatchEvent(event);
	}
	
	function createAnimeCall(config) {
		anime(config);
	}
	
	/* SVG TAG DEFINITIONS */
	
	function animate(el) {
		var target = el.parentNode,
			attributeName = el.getAttribute('attributeName'),
			configs = getStandardConfigs(el),
			i;
		for (i=0; i<configs.length; i++) {
			var config = configs[i];
			el.setAttributeNS(null, attributeName, el.getAttribute('from'));
			config[attributeName] = parseFloat(el.getAttribute('to'));
			console.log(config);
			createAnimeCall(config);
			
		}
		
		
	}
	
	function animateMotion(el) {
		
		var target = el.parentNode,
			path = getPath(el),
			configs = getStandardConfigs(el),
			i;
		
		for (i=0; i<configs.length; i++) {
			var config = configs[i];
			config.translate = path;
			config.rotate =  (el.getAttribute('rotate') === 'auto' ? path : undefined);
			console.log(config.complete);
			createAnimeCall(config);
		}
		
	}
};

animeSMIL.init();
