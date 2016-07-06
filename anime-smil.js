var animeSMIL = new function () {
	
	var els = {},
		REs = {
			sec: /([0-9]+)s/,
			ms: /([0-9]+)ms/,
			listSeparator: /\s*;\s*/
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
				pathEl.setAttributeNS(null, 'fill', 'transparent');
				
				
				rootSVG.appendChild(pathEl);
				r = anime.path(pathEl)
			
		}
		
		return r;
	};
	
	function isNumeric(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
	};
	
	function isDuration(s) {
		return s.match(REs.sec) || s.match(REs.ms) || s.trim() === '' || s === "0";
	}
	
	function getStandardConfigs(el) {
		var target = el.parentNode,
			id = el.getAttribute('id'),
			begin = el.getAttribute('begin') || "",
			beginEvent, beginEventTarget,
			i, r = [];
			
			beginList = begin.split(REs.listSeparator);
			
			for (i=0; i<beginList.length; i++) {
				var begin = beginList[i];
				console.log(begin);
				
				/*
				 * If this begin value is actual amount of time,
				 * then add the time to the anime config object.
				 * Otherwise, we need to add the `beginEvent` and
				 * `beginEventTarget` properties to it (which are
				 * not properties of anime) so `createAnimeCall`
				 * can set the events.
				 */
				console.log('begin, ', begin);
				if (isDuration(begin)) {
					console.log('isDuration');
					begin = getDuration(begin);
				} else {
					// otherwise, it's an event.
					console.log('is event');
					beginEvent = begin.split('.');
					
					if (beginEvent.length === 2) {
						beginEventTarget = document.getElementById(beginEvent[0]);
						beginEvent = beginEvent[1];
					} else if (beginEvent.length === 1){
						beginEventTarget = target;
						beginEvent = beginEvent[0];
					}
					console.log(beginEventTarget.nodeName, beginEvent)
					/* 
					 * If the target doesn't exist, we won't
					 * bother setting the event.
					 */
					if (beginEventTarget) {
						switch (beginEventTarget.nodeName) {
							case 'animate':
							case 'animateMotion':
								beginEvent = 'animeSMIL:' + beginEvent
								break;
							default:
								beginEvent = beginEvent;
						}
						
					} else {
						beginEvent = undefined;
					}
					
					begin = undefined;
				}
				r.push({
					SMIL: {
						id: id
					},
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
		var event = document.createEvent('Event');
		event.initEvent('animeSMIL:end', true, true);
		el.dispatchEvent(event);
	}
	
	function createAnimeCall(config) {
		if (config.beginEvent) {
			var target = config.targets,
				SMILfromValues = config.SMIL.fromValues;
				console.log('from values: ', SMILfromValues);
				console.log(target);
				/*
				 * TODO : do we have to cancel this event if it's fired again before it ends?
				 */
				config.beginEventTarget.addEventListener(config.beginEvent, function (e) {
					console.log('fire');
					
					for (i in SMILfromValues) {
						console.log('setting ', i, ' to ', SMILfromValues[i]);
						console.log(target);
						target.setAttribute(i, SMILfromValues[i]);
						if (target.style[i] !== undefined) {
							target.style[i] = "";
						}
					}
					
					anime(config);
				});
		} else {
			anime(config);
		}
	}
	
	/* SVG TAG DEFINITIONS */
	
	function animate(el) {
		var target = el.parentNode,
			attributeName = el.getAttribute('attributeName').trim(),
			configs = getStandardConfigs(el),
			values = el.getAttribute('values'),
			from, to, i;
			
		if (values) {
			values = values.trim().split(REs.listSeparator)
		}
		
		
		console.log(values);
		if (values && values.length == 2) {
			from = values[0];
			to = values[1];
		} else {
			from = el.getAttribute('from') || target.getAttribute(attributeName);
			to = el.getAttribute('to');
		}
		
		console.log('from/to', from, to);
			
		for (i=0; i<configs.length; i++) {
			var config = configs[i];
			
			if (from) {
				config.SMIL.fromValues = {};
				config.SMIL.fromValues[attributeName] = from;
			}
			
			if (to) {
				config.SMIL.toValues = {};
				config.SMIL.toValues[attributeName] = to;
			}
			
			target.setAttributeNS(null, attributeName, from);
			
			if (isNumeric(to)) {
				config[attributeName] = parseFloat(to);
			} else {
				config[attributeName] = to;
			}
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
			config.rotate =  (el.getAttribute('rotate') === 'auto' ? path : 0);
			console.log(config.complete);
			createAnimeCall(config);
		}
		
	}
};

animeSMIL.init();
