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
			duration = getDuration(el.getAttribute('dur')),
			calcMode = el.getAttribute('calcMode') || 'linear',
			keyTimes = el.getAttribute('keyTimes') || '0;1',
			keySplines = el.getAttribute('keySplines') || '0, 0, 1, 1',
			SMILBeginEvent, SMILBeginEventTarget,
			beginList = begin.split(REs.listSeparator),
			keyTimesList = keyTimes.split(REs.listSeparator),
			keySplinesList = keySplines.split(REs.listSeparator),
			delay = (getDuration(el.getAttribute('delay')) || 0),
			attributeName = el.getAttribute('attributeName') || "",
			from, to,
			values = el.getAttribute('values') || "",
			valuesList = values.trim().split(REs.listSeparator),
			i, j, r = [];
			
			
			if (keyTimesList.length !== keySplinesList.length + 1) {
				throw 'Error: KeyTimes "' + keyTimes + 
					'" do not have the same amount of values as KeySplines "' + 
					keySplines + '".';
			}
			
			values = values.trim();
			console.log(el);
			
			for (i=0; i<beginList.length; i++) {
				var begin = beginList[i];
				
				for (j=0; j<keySplinesList.length; j++) {
					var keyTime = keyTimesList[j],
						keyTimeDurationPercentage = parseFloat(keyTimesList[j+1]) - keyTime,
						keySpline = keySplinesList[j],
						keyTimeDelayOffset = keyTime * duration,
						fromValues = {}, toValues = {},
						SMILBegin;
						
						if (values && valuesList.length >= j+2) {
							console.log('from values list');
							from = valuesList[j];
							to = valuesList[j+1];
						} else {
							console.log('from from to attrs');
							from = el.getAttribute('from') || target.getAttribute(attributeName);
							to = el.getAttribute('to');
						}
						
						keyTimeDuration = duration * keyTimeDurationPercentage;
						console.log('keyTimeDurationPercentage: ' + keyTimeDurationPercentage + 'duration: ' + duration);
						
						if (from) {
							fromValues[attributeName] = from;
						}
						
						if (to) {
							toValues[attributeName] = to;
						}
					
					/*
					 * If this begin value is actual amount of time,
					 * then add the time to the anime config object.
					 * Otherwise, we need to add the `beginEvent` and
					 * `beginEventTarget` properties to it (which are
					 * not properties of anime) so `createAnimeCall`
					 * can set the events.
					 */
					if (isDuration(begin)) {
						console.log('isDuration');
						SMILBegin = getDuration(begin);
					} else {
						// otherwise, it's an event.
						console.log('is event');
						SMILBeginEvent = begin.split('.');
						
						if (SMILBeginEvent.length === 2) {
							SMILBeginEventTarget = document.getElementById(SMILBeginEvent[0]);
							SMILBeginEvent = SMILBeginEvent[1];
						} else if (SMILBeginEvent.length === 1){
							SMILBeginEventTarget = target;
							SMILBeginEvent = SMILBeginEvent[0];
						}
						console.log(SMILBeginEventTarget.nodeName, SMILBeginEvent)
						/* 
						 * If the target doesn't exist, we won't
						 * bother setting the event.
						 */
						if (SMILBeginEventTarget) {
							switch (SMILBeginEventTarget.nodeName) {
								case 'animate':
								case 'animateMotion':
									SMILBeginEvent = 'animeSMIL:' + SMILBeginEvent
									break;
								default:
									SMILBeginEvent = SMILBeginEvent;
							}
							
						} else {
							SMILBeginEvent = undefined;
						}
						
						SMILBegin = undefined;
					}
					r.push({
						SMIL: {
							id: id,
							fromValues: fromValues,
							toValues: toValues
						},
					  targets: target,
					  duration: keyTimeDuration || 0,
					  loop: (el.getAttribute('repeatCount') === 'indefinite'),
					  easing: (el.getAttribute('easing') || 'linear'),
					  delay: delay + keyTimeDelayOffset,
					  complete: function() { completeEvent(el) },
					  begin: SMILBegin,
					  beginEvent: SMILBeginEvent,
					  beginEventTarget: SMILBeginEventTarget
					});
				}
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
				 * TODO : do we have to cancel this event if it's fired again before 
				 * it ends?
				 */
				config.beginEventTarget.addEventListener(config.beginEvent, function (e) {
					console.log('fire');
					
					for (i in SMILfromValues) {
						console.log('setting ', i, ' to ', SMILfromValues[i]);
						console.log(target);
						target.setAttribute(i, SMILfromValues[i]);
						
						/* 
						 * Styles sometimes are set when you set attributes that have an
						 * equivalent CSS attribute.  We must work around this.
						 */
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
			from, to, i;
			
		
		
		
		for (i=0; i<configs.length; i++) {
			var config = configs[i],
				from = config.SMIL.fromValues[attributeName],
				to = config.SMIL.toValues[attributeName],
				values = config.SMIL.values;
			
			
			console.log('from/to', from, to);
			console.log(values);
			
			
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
			createAnimeCall(config);
		}
		
	}
};

animeSMIL.init();
