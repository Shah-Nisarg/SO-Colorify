// ==UserScript==
// @name         Colorify
// @namespace    SE-Colorify
// @version      0.4
// @description  Let's you give custom colors to tags and hide questions from evil tags.
// @author       Nisarg Shah
// @include      https://stackoverflow.com/*
// @include      http*//*.stackoverflow.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
	
	// Utility functions.
	function storage(key, value, defaultValue) {
		if(value) {
			localStorage.setItem(key, JSON.stringify(value));
		}
		
		value = localStorage.getItem(key);
		if(value) {
			return JSON.parse(value);
		} else {
			return defaultValue;
		}
	}
	
	function addTagStyle(style) {
		// Remove if the style is already configured.
		var sameTagStyles = tagStyles.filter(t => t.name == style.name);
		if(sameTagStyles.length > 0) {
			console.log("Removing styles: ", sameTagStyles, "For tag: ", style.name);
			sameTagStyles.forEach(t => tagStyles.splice(tagStyles.indexOf(t), 1));
		}
		
		// Add the style.
		if(tagStyles) {
			tagStyles.push(style);
			storage(storageKeys.allStyles, tagStyles);
		
			// Apply the style.	
			applyStyles(tagStyles);
		}
	}
	
	function removeTagStyle(tagName) {
		// Remove the style.
		var sameTagStyles = tagStyles.filter(t => t.name == tagName);
		if(sameTagStyles.length > 0) {
			console.log("Removing styles: ", sameTagStyles, "For tag: ", tagName);
			sameTagStyles.forEach(t => tagStyles.splice(tagStyles.indexOf(t), 1));
		}
		
		// Update storage.
		storage(storageKeys.allStyles, tagStyles);
		
		// Apply the style.	
		applyStyles(tagStyles);
	}
	
	function getTagStyle(tagName) {
		var tagStyle = tagStyles.filter(t => t.name == tagName);
		return tagStyle[0];
	}
	
	function setPropOnTag(tagName, prop) {
		var sameTagStyles = tagStyles.filter(t => t.name == tagName);
		if(sameTagStyles.length > 0) {
			sameTagStyles[0][prop] = true;
		} else {
			var style = new TagStyle(tagName, "", "");
			style[prop] = true;
			tagStyles.push(style);
		}
		
		storage(storageKeys.allStyles, tagStyles);
		console.log(tagStyles);
	}
	
	function clearPropFromTag(tagName, prop) {
		var sameTagStyles = tagStyles.filter(t => t.name == tagName);
		if(sameTagStyles.length > 0) {
			sameTagStyles[0][prop] = false;
		}
		
		storage(storageKeys.allStyles, tagStyles);
		console.log(tagStyles);
	}
	
    function getStyles(tag) {
        var styles = "";
        Object.keys(tag).forEach(function(prop) {
            switch (prop) {
                case "bgcolor":
                    styles += "background-color: " + tag[prop] + ";";
                    break;
                case "color":
                    styles += "color: " + tag[prop] + ";";
                    break;
                default:
                    break;
            }
        });

        return styles;
    }
	
	function getTagClassByName(name) {
		return "t-" + name.replace(".","û");
	}
	
	var currentStyleElement = "";
	function applyStyles(allStyles) {		
		var questionSelector = ".question-summary";
		var tagsSelector = ".tags";
		var style = "";
		
		// Remove previously set styles.
		if(currentStyleElement) {
			$("#" + currentStyleElement).remove();
		}

		// Calculate all styles to be injected.
		allStyles.forEach(function(tag) {
			// style += tagsSelector + " > a[href"+ (tag.selectorType || '$')+"='"+tag.name +"'] " +  "{ "+ getStyles(tag) +" }";
			style += "a[href$='/"+tag.name +"'].post-tag " +  "{ "+ getStyles(tag) +" }";
		});

		var styleElement = GM_addStyle(style);
		console.log("Add style: ", styleElement);
		currentStyleElement = styleElement.id;
	}
	
	function shiftTagMenu(offset) {
		var currentTopLocation = $("#tag-menu").parent().css("top");
		$("#tag-menu").parent().css("top", (parseInt(currentTopLocation) + offset) + "px");
	}
	
	var notificationIndex = 0;
	function notify(message, timeout) {
		// Remove previous notification.
		if($("#notify-" + notificationIndex).length > 0) {
			StackExchange.notify.close(notificationIndex);
			shiftTagMenu(-34);
		}
		
		// Create a new notification.
		notificationIndex++;
		StackExchange.notify.show(message, notificationIndex);
		shiftTagMenu(34);
		
		// If timeout is specified, close the notification automatically.
		if(timeout) {
			setTimeout(function(index) {
				if($("#notify-" + index).length > 0) {
					StackExchange.notify.close(index);
					shiftTagMenu(-34);
				}
			},timeout, notificationIndex);
		}
	}
	
	function notifyInTagMenu(message, timeout) {
		$("#tag-menu .SO-colorify-message").text(message);
		
		if(timeout) {
			setTimeout(function() {
				$("#tag-menu .SO-colorify-message").text("");	
			}, timeout);
		}
	}
	
	function removeTagMenu() {
		$("#tag-menu").remove();
	}
	
	// Storage keys.
	var storageKeys = {
		"allStyles": "colorify-allStyles"
	};

	// TagStyle constructor.
	var TagStyle = function(tagName, bgcolor, color) {
		var self = this;
		self.name = tagName;
		self.bgcolor = bgcolor;
		self.color = color;
		self.blur = false;
		self.hide = false;
	};
	
	// Load the tag styles from storage.
	var tagStyles = storage(storageKeys.allStyles, undefined, []);
	applyStyles(tagStyles);
	
    var presetStyleCombos = [
		{
			bgcolor: "#8BC34A",
			color: "white"
		},
		{
			bgcolor: "red",
			color: "white"
		},
		{
			bgcolor: "#FFC107",
			color: "white"
		},
		{
			bgcolor: "yellow"
		},
		{
			bgcolor: "#03A9F4",
			color: "white"
		},
		{
			bgcolor: "#673AB7",
			color: "white"
		},
		{
			bgcolor: "#FFEB3B"
		},
		{
			bgcolor: "#CDDC39"
		},
		{
			bgcolor: "#607D8B",
			color: "yellow"
		}
	];
	
    // Apply blurs to questions containing blurrable tags.
    function applyBlur() {
		var blurrableTags = tagStyles.filter(t => t.blur);
    	var blurrableTagClasses = blurrableTags.map(t => t.className = getTagClassByName(t.name));
    
		var questionSelector = ".question-summary";
		var tagsSelector = ".tags";
		
        $(questionSelector).each(function(){
            var classes = $(this).find(tagsSelector).prop("classList");
            var blurQuestion = Array.from(classes).some(t => blurrableTagClasses.includes(t));

            if(blurQuestion) {
				$(this).addClass("blurred");
            } else {
				$(this).removeClass("blurred");
			}
        });
    }
	
	function applyHide() {
		var blurrableTags = tagStyles.filter(t => t.hide);
    	var blurrableTagClasses = blurrableTags.map(t => t.className = getTagClassByName(t.name));
    
		var questionSelector = ".question-summary";
		var tagsSelector = ".tags";
		
        $(questionSelector).each(function(){
            var classes = $(this).find(tagsSelector).prop("classList");
            var blurQuestion = Array.from(classes).some(t => blurrableTagClasses.includes(t));

            if(blurQuestion) {
				$(this).addClass("SO-colorify-hidden");
            } else {
				$(this).removeClass("SO-colorify-hidden");
			}
        });
    }

    function refresh() {
        if($(".new-post-activity").length > 0) {
            $(".new-post-activity").click();
            applyBlur();
			applyHide();
        }
    }

    $(document).on("click", ".intellitab", function(event) {
	  	setTimeout(function() {
			applyBlur();
			applyHide();
		},100);
    });

	$(document).ajaxComplete(function( event, xhr, settings ) {
		if (settings.url.toLowerCase().indexOf("/questions") > -1) {
			applyBlur();
			applyHide();
		} else if(settings.url.toLowerCase().indexOf("/tags") > -1 && settings.url.toLowerCase().indexOf("/subscriber-info") > -1) {
			var tagName = settings.url.toLowerCase().split("tags")[1].split("subscriber-info")[0].split("/").join("");
			console.log("Current tag: " , tagName);

			// SO makes a request to https://stackoverflow.com/tags/[tagname]/subscriber-info?_=1508393742280 when you hover any tag.
			setTimeout(function() {
				console.log("Tag info loaded.", $("#tag-menu"));
				
				var currentTagStyle = getTagStyle(tagName);

				$("#tag-menu").append(
					"" +
					"<span class='tm-links SE-colorify'>" +
						"<span class='SE-colorify-label'>Color: </span>" +
						"<input type='text' class='SE-colorify-input SE-colorify-color' placeholder='#fff'"+
							" value='"+ (currentTagStyle ? currentTagStyle.color : "") +"' />"+
						"<span class='SE-colorify-label'>Background: </span>" +
						"<input type='text' class='SE-colorify-input SE-colorify-bgcolor' placeholder='#000'"+
							" value='"+ (currentTagStyle ? currentTagStyle.bgcolor : "") +"'/>" +
						"<a href='#' class='SE-colorify-link save-changes'>Save</a>" +
						"<a href='#' class='SE-colorify-link clear-changes'>Clear</a>" +
						"<a href='#' class='SE-colorify-link set-random'>Random</a>" +
						"<br />" +
						"<label class='SE-colorify-config' title='Blur Questions'>" +
							"<input type='checkbox' class='blur-questions' "+ ((currentTagStyle && currentTagStyle.blur) ? "checked='checked'" : "") +" />" +
							"Blur" +
						"</label>" +
						"&nbsp;&nbsp;&nbsp;&nbsp;" + 
						"<label class='SE-colorify-config' title='Hide Questions'>" +
							"<input type='checkbox' class='hide-questions' "+ ((currentTagStyle && currentTagStyle.hide) ? "checked='checked'" : "") +" />" +
							"Hide" +
						"</label>" +
						"&nbsp;&nbsp;&nbsp;&nbsp;" + 
						"<span class='SO-colorify-message'></span>" + 
					"</span>"
			 	);

				$("#tag-menu .SE-colorify .SE-colorify-color").on("input", function(){
					$("a.post-tag[href$='" + tagName+ "']").css("color", $(this).val() || "");
				});

				$("#tag-menu .SE-colorify .SE-colorify-bgcolor").on("input", function(){
					$("a.post-tag[href$='" + tagName+ "']").css("background-color", $(this).val() || "");
				});

				$("#tag-menu .SE-colorify .save-changes").on("click",function(event) {
					event.preventDefault();
					
					var color = $(this).parent().find(".SE-colorify-color").val();
					var bgcolor = $(this).parent().find(".SE-colorify-bgcolor").val();
					
					if(bgcolor || color) {
						addTagStyle(new TagStyle(tagName, bgcolor, color));
					} else {
						removeTagStyle(tagName);
					}
					
					console.log("Saved changes!", tagName, bgcolor, color);
					// notify("Style changes saved successfully.", 3000);
					
					// Clear the custom CSS.
					$("a.post-tag[href$='" + tagName+ "']").css("color", "");
					$("a.post-tag[href$='" + tagName+ "']").css("background-color", "");
					
					notifyInTagMenu("Changes saved.", 3000);
				});
				
				$("#tag-menu .SE-colorify .clear-changes").on("click",function(event) {
					event.preventDefault();
					removeTagStyle(tagName);
					
					// Clear the textboxes:
					$(this).parent().find(".SE-colorify-color").val("");
				 	$(this).parent().find(".SE-colorify-bgcolor").val("");	
					
					notifyInTagMenu("Style cleared.", 3000);
				});
				
				$("#tag-menu .SE-colorify .set-random").on("click",function(event) {
					event.preventDefault();
					
					var index = Math.floor(Math.random() * presetStyleCombos.length);
					
					$(this).parent().find(".SE-colorify-color").val(presetStyleCombos[index].color || "");
				 	$(this).parent().find(".SE-colorify-bgcolor").val(presetStyleCombos[index].bgcolor || "");
					
					// Apply temporary colors.
					$(this).parent().find(".save-changes").click();
				});
				
				$("#tag-menu .SE-colorify .blur-questions").on("change",function(event) {
					if($(this).prop("checked")) {
						console.log("Blurring " + tagName);
						setPropOnTag(tagName, "blur");
					} else {
						console.log("Unblurring " + tagName);
						clearPropFromTag(tagName, "blur");
					}
					
					setTimeout(function(){
						removeTagMenu();
						applyBlur();
					}, 3000);
					
					notifyInTagMenu("Applying changes in 3 seconds.", 3000);
				});
				
				$("#tag-menu .SE-colorify .hide-questions").on("change",function(event) {
					if($(this).prop("checked")) {
						console.log("Hiding " + tagName);
						setPropOnTag(tagName, "hide");
					} else {
						console.log("Showing " + tagName);
						clearPropFromTag(tagName, "hide");
					}
					
					setTimeout(function(){
						removeTagMenu();
						applyHide();
					}, 3000);
					
					notifyInTagMenu("Applying changes in 3 seconds.", 3000);
				});
				
				setTimeout(function() {
					var containerHeight = $("#tag-menu").parent().css("height");
					$("#tag-menu").parent().css("height", (parseInt(containerHeight) + 52) + "px");
				}, 350);
			});
		}
	});

    setInterval(refresh, 2000);
    applyBlur();
	applyHide();
	
	GM_addStyle(`
		.SE-colorify-label {
			color: #fff;
			font-size: 11px;
		}

		input[type=text].SE-colorify-input {
			height: 13px;
			width: 50px;
			color: #fff;
			background-color: #535a60;
			padding: 3px;
			border: none;
			box-shadow: none;
			font-size: 11px;
			border-bottom: 1px solid #fff;
			margin-right: 5px;
		}

		.SE-colorify {
			display: block;
		}

		.SE-colorify-config  {
			font-size: 11px;
			color: #fff;
		}

		#tag-menu {
			width: 338px;
		}

		.SO-colorify-message,
		.blur-questions,
		.hide-questions {
			color: #eee;
			font-size: 11px;
		}

		.question-summary {
			transition: opacity 0.5s 0.5s ease;
		}

		.question-summary.blurred {
			opacity: 0.1;
		}

		.question-summary.blurred:hover {
			opacity: 1;
		}

		.SO-colorify-hidden {
			height: 15px;
		}

		.SO-colorify-hidden:hover {
			height: auto;
		}
	`);
})();