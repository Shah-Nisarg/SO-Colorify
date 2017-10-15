// ==UserScript==
// @name         Colorify
// @namespace    SE-Colorify
// @version      0.1
// @description  Adds color to various tags for SO.
// @author       Nisarg Shah
// @include      https://stackoverflow.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    var styleConfig = {
        tags: [
            {
                name: "javascript",
                bgcolor: "#8BC34A",
                color: "white"
            },
            {
                name: "php",
                bgcolor: "red",
                color: "white",
                blur: true
            },
            {
                name: "html",
                bgcolor: "#FFC107",
                color: "white",
                selectorType: "*"
            },
            {
                name: "css",
                bgcolor: "yellow",
                selectorType: "*"
            },
            {
                name: "android",
                bgcolor: "red",
                color: "white",
                selectorType: "*",
                blur: true
            },
            {
                name: "wordpress",
                bgcolor: "red",
                color: "white",
                selectorType: "*"
            },
            {
                name: "jquery",
                bgcolor: "#03A9F4",
                color: "white",
                selectorType: "*"
            },
            {
                name: "node",
                bgcolor: "red",
                color: "white",
                selectorType: "*",
                blur: true
            },
            {
                name: "node.js",
                bgcolor: "red",
                color: "white",
                selectorType: "*",
                blur: true
            },
            {
                name: "java",
                bgcolor: "red",
                color: "white",
                blur: true
            },
            {
                name: "c%23",
                bgcolor: "#673AB7",
                color: "white"
            },
            {
                name: ".net",
                bgcolor: "#673AB7",
                color: "white"
            },
            {
                name: "asp.net",
                bgcolor: "#673AB7",
                color: "white"
            },
            {
                name: "sql-server",
                bgcolor: "#FFEB3B"
            },
            {
                name: "typescript",
                bgcolor: "red",
                color: "white",
                blur: true
            },
            {
                name: "angular",
                bgcolor: "red",
                color: "white",
                selectorType: "*",
                blur: true
            },
            {
                name: "wpf",
                bgcolor: "red",
                color: "white",
                blur: true
            },
            {
                name: "azure",
                bgcolor: "red",
                color: "white"
            },
            {
                name: "regex",
                bgcolor: "#CDDC39"
            },
            {
                name: "python",
                bgcolor: "#607D8B",
                color: "yellow"
            }
        ]
    };

    var questionSelector = ".question-summary";
    var tagsSelector = ".tags";

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

    var style = "";

    styleConfig.tags.forEach(function(tag) {
        style += tagsSelector + " > a[href"+ (tag.selectorType || '$')+"='"+tag.name +"'] " +  "{ "+ getStyles(tag) +" }";
    });

    GM_addStyle(style);

    GM_addStyle(`
      .reputation-score {
        font-size: 25px;
      }
    `);
  
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
 
    // Apply blurs to questions containing blurrable tags.
    var blurrableTags = styleConfig.tags.filter(t => t.blur);
    var blurrableTagClasses = blurrableTags.map(t => t.className = "t-" + t.name.replace(".","û"));
    function applyBlur() {
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
		}
	});

    setInterval(refresh, 2000);
    applyBlur();
})();