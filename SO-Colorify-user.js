// ==UserScript==
// @name         Colorify
// @namespace    SE-Colorify
// @version      0.2
// @description  Let's you give custom colors to tags.
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
			style += "a[href"+ (tag.selectorType || '$')+"='"+tag.name +"'].post-tag " +  "{ "+ getStyles(tag) +" }";
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
	
  	// Disables clicks on an element and its children.
  	var elementsWithClickDisabled = [];
  	$(document).on("click", ".question-hyperlink", function(event){
	  	var questionID = $(this).parents(".question-summary")[0].id;
	  	console.log(questionID, elementsWithClickDisabled);
	  	if(elementsWithClickDisabled.indexOf(questionID) > -1) {
			event.preventDefault();
		}
	});

  	function disableClicks (elem) {
	  elementsWithClickDisabled.push(elem[0].id);

	  console.log("disabling", elem[0].id);
	}

  	function enableClicks (elem) {
		var index = elementsWithClickDisabled.indexOf(elem[0].id);
	  	if(index > -1){
			elementsWithClickDisabled.splice(index, 1);
		}
	}

  	function injectTagControls() {
		$("#content .tags").on("mouseover",".post-tag", function() {
			console.log("Mouse inside tag area", $(this));

			// The .tag-menu is loaded roughly 1 second later with an animation.
		});
	}

    // Apply blurs to questions containing blurrable tags.
    var blurrableTags = tagStyles.filter(t => t.blur);
    var blurrableTagClasses = blurrableTags.map(t => t.className = getTagClassByName(t.name));
    function applyBlur() {
		var questionSelector = ".question-summary";
		var tagsSelector = ".tags";
		
        $(questionSelector).each(function(){
            var classes = $(this).find(tagsSelector).prop("classList");
            var blurQuestion = Array.from(classes).some(t => blurrableTagClasses.includes(t));

            if(blurQuestion) {
                $(this).css("filter", "blur(3px)");
                $(this).css("height", "10px");

                $(this).on("click", function(event) {
                    if(event.ctrlKey) {
					  	$(this).css("height", "auto");
                        $(this).css("filter", "none");
					  	enableClicks($(this));
                    } else if(event.altKey) {
                        $(this).css("filter", "blur(3px)");
					  	$(this).css("height", "10px");
					  	disableClicks($(this));
                    }
                });

			  	disableClicks($(this));
            }
        });
    }

    function refresh() {
        if($(".new-post-activity").length > 0) {
            $(".new-post-activity").click();
            applyBlur();
        }
    }

    $(document).on("click", ".intellitab", function(event) {
	  	setTimeout(function() {
			applyBlur();
		},100);
    });

	$(document).ajaxComplete(function( event, xhr, settings ) {
		if (settings.url.toLowerCase().indexOf("/questions") > -1) {
			applyBlur();
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
//						"<label class='SE-colorify-config'>" +
//							"<input type='checkbox' class='blur-questions' />" +
//							"Blur Questions" +
//						"</label>" +
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
				});
				
				$("#tag-menu .SE-colorify .clear-changes").on("click",function(event) {
					event.preventDefault();
					removeTagStyle(tagName);
					
					// Clear the textboxes:
					$(this).parent().find(".SE-colorify-color").val("");
				 	$(this).parent().find(".SE-colorify-bgcolor").val("");	
					
					notify("Style changes cleared successfully.", 3000);
				});
				
				$("#tag-menu .SE-colorify .set-random").on("click",function(event) {
					event.preventDefault();
					
					var index = Math.floor(Math.random() * presetStyleCombos.length);
					
					$(this).parent().find(".SE-colorify-color").val(presetStyleCombos[index].color || "");
				 	$(this).parent().find(".SE-colorify-bgcolor").val(presetStyleCombos[index].bgcolor || "");
					
					// Apply temporary colors.
					$(this).parent().find(".save-changes").click();
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

	// Inject various controls with the tags.
	// setInterval(injectTagControls, 1000);
	injectTagControls();
	
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
	`);
})();