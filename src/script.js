//#############################################################################
//#             				 		                                      #
//#             		   			GLOBAL CODE 	                          #
//#             				       			                              #
//#############################################################################

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$ GLOBAL VARIABLES $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

/* Register events to use in inter-view communication:
	selectCourse event - Select a course in the bertin matrix
	selectUniversity event - Select an university/college in the bertin matrix
	selectArea event - Select an area in the sunburst
	unselectUniversity event - TODO
*/
var dispatch = d3.dispatch("selectCourse", "selectUniversity", 
	"unselectUniversity", "selectArea");

//Global Colors to the data representation
var color1 = d3.scaleOrdinal(d3.schemeCategory10);
var rootDataColor = color1(0);
	
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$ GLOBAL FUNCTIONS $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$	
	
var breadcrumbDim = {
		w: 195,
		h: 30,
		s: 3,
		t: 10
	};
	
//Draw/update breadcrumbs
function drawBreadcrumbs(svg,nodeArray,dataKey,onBreadcrumbClick,breadcrumbColor,breadcrumbDimensions) {
	//Dimensions of breadcrumb
	var breadcrumbDim = breadcrumbDimensions;
	
	//Return a string with all the points of a breadcrumb item. 
	function breadcrumbPoints(datum, index) {
		var points = [];
		points.push("0,0");
		points.push(breadcrumbDim.w + ",0");
		points.push(breadcrumbDim.w + breadcrumbDim.t + "," + (breadcrumbDim.h / 2));
		points.push(breadcrumbDim.w + "," + breadcrumbDim.h);
		points.push("0," + breadcrumbDim.h);
		if (index > 0) {
			points.push(breadcrumbDim.t + "," + (breadcrumbDim.h / 2));
		}
		return points.join(" ");
	}
	
	var g = svg.selectAll("g")
		.data(nodeArray, function(d) {
			return d[dataKey];
		});

	var entering = g.enter()
		.append("g")
		.attr("transform", function(d, i) {
			return "translate(" + i * (breadcrumbDim.w + breadcrumbDim.s) + ", 0)";
		});

	entering.append("polygon")
		.on("click", onBreadcrumbClick)
		.transition().duration(750)
		.attr("points", breadcrumbPoints)
		.attr("class", "breadcrumbItem")
		.style("fill", breadcrumbColor);

	entering.append("text")
		.on("click", onBreadcrumbClick)
		.attr("x", (breadcrumbDim.w + breadcrumbDim.t) / 2)
		.attr("y", breadcrumbDim.h / 2)
		.attr("dy", "0.35em")
		.attr("text-anchor", "middle")
		.attr("class", "breadcrumbItem")
		.text(function(d) {
			return getBreadcrumbString(d[dataKey]);
		});

	g.exit().transition().duration(750).remove()
}	
	
//#############################################################################
//#             				 		                                      #
//#             		   UNIVERSITY AND COURSES VIEW                        #
//#             				       			                              #
//#############################################################################

//######################## Auxiliary functions ################################

//Return the string to use in the breadcrumb
function getBreadcrumbString(text) {
	var res = "";
	var tokens = text.split(" ");
	var cleanTokens = [];
	for (var i = 0; i < tokens.length; i++) {
		if (tokens[i][0] != null && tokens[i][0].match(/[A-Z]|É|-/)) {
			cleanTokens.push(tokens[i]);
		}
	}
	for (var i = 0; i < cleanTokens.length; i++) {
		if (cleanTokens.length <= 2) {
			res += cleanTokens[i] + " ";
		} else if (cleanTokens.length == 3) {
			res += cleanTokens[i].substring(0, 6) + ". ";
		} else if (cleanTokens.length == 4) {
			res += cleanTokens[i].substring(0, 4) + ". ";
		} else {
			res += cleanTokens[i].substring(0, 3) + ". ";
		}
	}
	return res;
}

//Return the acronym of the name
function getAcronym(name) {
	var res = "";
	var tokens = name.split(" ");
	var cleanTokens = [];
	for (var i = 0; i < tokens.length; i++) {
		if (tokens[i][0] != null && tokens[i][0].match(/[A-Z]|É|-/)) {
			res += tokens[i][0];
			cleanTokens.push(tokens[i]);
		}
	}
	if (res.length == 1) {
		res = cleanTokens[0].substring(0, 6);
	} else if (res.length == 2) {
		res = cleanTokens[0].substring(0, 3) + cleanTokens[1].substring(0, 3);
	}
	return res;
}

// Get the string to use in the tooltip of the circle
function getBertinMatrixCircleTooltip(d) {
	var res = "Percentagem Desemprego: " + d.PercentagemDesemprego.toFixed(2) + "%";
	res += "\nTotal Desempregados: " + d.TotalDesempregados;
	res += "\nTotal Dimplomados: " + d.TotalDiplomados;
	return res;
}

//######################## Visualization Functions #########################

var fullPublicCourseDataset; 	//All the public courses dataset
var fullPrivateCourseDataset; 	//All the private courses dataset

var universityVisObj = new Object();

// Load all the course data!
d3.json("CoursesPublic.json", function(publicCoursesData) {
	d3.json("CoursesPrivate.json", function(privateCoursesData) {
		fullPrivateCourseDataset = {
			"key": "Ensino Privado",
			"values": privateCoursesData
		};
	});
	fullPublicCourseDataset = {
		"key": "Ensino Público",
		"values": publicCoursesData
	};
	generateUniversityVis(); //Generate the matrix Visualisation
});

//Receive event from view change in scatterplot when a user remove a filter (university)
dispatch.on("unselectUniversity", function(selected, dummy) {
	//TODO
});

/*######################## Breadcrumb Functions ########################*/

function matrixBreadcrumbClick(d, i) {
	var removeCount = universityVisObj.previousCollections.length - (i + 1);
	for (var k = 0; k < removeCount; k++) {
		universityVisObj.previousCollections.pop();
		universityVisObj.currentCollIndex--;
	}
	updateUniversityVisualization(universityVisObj, universityVisObj.previousCollections[universityVisObj.currentCollIndex].values);
}

/*######################### Context Menu Functions ########################*/

var menuItems = ["Back", "Private Courses", "Sort Unemployment Ascending", "Sort Unemployment Descending",
					"Sort Alphabetical [A-Z]", "Sort Alphabetical [Z-A]"];

function drawContextMenu(x, y, menuItems) {
	var menuItemHeight = 25;
	var menuItemWidth = 210;
	//Remove the current menu if we open it in other place	
	d3.select('.context-menu').remove();
	// Draw the menu
	universityVisObj.svg
		.append('g').attr('class', 'context-menu')
		.selectAll('tmp')
		.data(menuItems).enter()
		.append('g')
		.attr('class', 'menu-entry')
		.on("click", function() { 			//Context menu click actions
			if (d3.select(this).select("text").text() === "Sort Unemployment Ascending") {
				universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
					return d1.MediaDesemprego - d2.MediaDesemprego;
				});
			} else if (d3.select(this).select("text").text() === "Sort Unemployment Descending") {
				universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
					return d2.MediaDesemprego - d1.MediaDesemprego;
				});
			} else if (d3.select(this).select("text").text() === "Sort Alphabetical [Z-A]") {
				universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
					return d2.key.toLowerCase().localeCompare(d1.key);
				});
			} else if (d3.select(this).select("text").text() === "Sort Alphabetical [A-Z]") {
				universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
					return d1.key.toLowerCase().localeCompare(d2.key);
				});
			} else if (d3.select(this).select("text").text() === "Public Courses" ||
				d3.select(this).select("text").text() === "Private Courses") {
				if (universityVisObj.publicUniversities) {
					universityVisObj.publicUniversities = false;
					menuItems[1] = "Public Courses";
					universityVisObj.previousCollections = [fullPrivateCourseDataset];
					universityVisObj.currentCollIndex = 0;
				} else {
					universityVisObj.publicUniversities = true;
					menuItems[1] = "Private Courses";
					universityVisObj.previousCollections = [fullPublicCourseDataset];
					universityVisObj.currentCollIndex = 0;
				}
			} else {
				if (universityVisObj.currentCollIndex > 0) {
					universityVisObj.previousCollections.pop();
					universityVisObj.currentCollIndex--;
				} else {
					return;
				}
			}
			updateUniversityVisualization(universityVisObj, universityVisObj.previousCollections[universityVisObj.currentCollIndex].values);
		});

	d3.selectAll('.menu-entry')
		.append('rect')
		.attr('x', x)
		.attr('y', function(d, i) {
			return y + (i * menuItemHeight);
		})
		.attr('width', menuItemWidth)
		.attr('height', menuItemHeight);

	d3.selectAll(".menu-entry")
		.append("text")
		.text(function(d) {
			return d;
		})
		.attr("class", "menu-entry text")
		.attr("x", x)
		.attr("y", function(d, i) {
			return y + (i * menuItemHeight);
		})
		.attr("dy", menuItemHeight - 5 / 2)
		.attr("dx", 5);

	// Other interactions remove the menu ex:Clicking elsewhere!!
	d3.select("body")
		.on("click", function() {
			d3.select(".context-menu").remove();
		});
}

//Update the bertin matrix y-axis label according to the quantity of data presented.
function updateBertinMatrixYaxisLabel(newHeight) {
	var labelWidth = 60;
	var label = "";
	if (universityVisObj.currentCollIndex == 0) {
		label = "Universities";
	} else if (universityVisObj.currentCollIndex == 1) {
		label = "Colleges";
	} else if (universityVisObj.currentCollIndex == 2) {
		label = "Courses";
	}
	universityVisObj.svg.select(".yaxisLabelMatrix")
		.transition()
		.duration(1000)
		.attr("y", universityVisObj.paddingObj.left / 6)
		.attr("x", -(newHeight + labelWidth) / 2)
		.attr("transform", "rotate(-90)")
		.text(label);
}

//Call to update university (Bertin Matrix) visualization with a new data
function updateUniversityVisualization(universityVisObj, newCollection) {
	var minimumHeight = 300;
	var newHeight = newCollection.length * universityVisObj.matrixLineHeight;
	newHeight = (newHeight < minimumHeight) ? minimumHeight : newHeight;

	universityVisObj.yaxis.scale().domain(newCollection.map(function(d) {
			return d.key;
		}))
		.range([universityVisObj.paddingObj.top, newHeight - universityVisObj.paddingObj.bottom]);
	universityVisObj.svg.attr("height", newHeight);

	var transition = d3.transition().duration(1000);

	//Select all the matrix data lines and remove them
	universityVisObj.svg.selectAll("g.data").remove();

	//Add new Data
	var groupLine = universityVisObj.svg
		.selectAll("g.data")
		.data(newCollection).enter().append("g")
		.attr("class", "data")
		.attr("y", function(d) {
			return universityVisObj.yaxis.scale()(d.key);
		});

	groupLine.append("rect")
		.attr("class", "matrixLine")
		.attr("id", function(d) {
			return d.key;
		})
		.attr("x", universityVisObj.paddingObj.left)
		.attr("y", function(d) {
			return universityVisObj.yaxis.scale()(d.key) - (universityVisObj.matrixLineHeight / 2);
		})
		.attr("width", universityVisObj.width - universityVisObj.paddingObj.right)
		.attr("height", universityVisObj.matrixLineHeight);

	groupLine.selectAll("circle")
		.data(function(d) {
			return d.data;
		})
		.enter().append("circle")
		.on("contextmenu", function() {
			d3.event.preventDefault();
			drawContextMenu(d3.mouse(this)[0], d3.mouse(this)[1],menuItems);
		})
		.transition(transition)
		.attr("r", function(dy) {
			return Math.sqrt(universityVisObj.circleScale(dy.PercentagemDesemprego));
		})
		.attr("cy", function(dy) {
			return universityVisObj.yaxis.scale()(dy.key);
		})
		.attr("cx", function(dy) {
			return universityVisObj.xaxis.scale()(dy.Ano);
		})
		.attr("fill",rootDataColor);

	universityVisObj.svg
		.selectAll("g.data")
		.selectAll("circle")
		.append("title").text(function(dy) {
			return getBertinMatrixCircleTooltip(dy);
		});

	//Update yaxis labels due to new elements
	universityVisObj.svg.selectAll(".yaxis").transition().duration(1000).call(universityVisObj.yaxis);
	universityVisObj.svg.select(".yaxis").selectAll(".tick").append("title").text(function(d) {
		return d;
	});

	var currentSelection = [universityVisObj.previousCollections[universityVisObj.currentCollIndex].key];
	if (universityVisObj.currentCollIndex == 2) {
		currentSelection.push(universityVisObj.previousCollections[universityVisObj.currentCollIndex - 1].key);
	}
	// Alert other views that a university/college was selected
	dispatch.call("selectUniversity", currentSelection, currentSelection);

	drawBreadcrumbs(d3.select("#universityBreadcrumb").select("svg"),
		universityVisObj.previousCollections,"key",matrixBreadcrumbClick,rootDataColor,breadcrumbDim);

	updateBertinMatrixYaxisLabel(newHeight);

	//Register Interaction events to the new elements!!
	registerEventsUniversityVis();
}

// Code related to University Visualization creation (Bertin Matrix)
function generateUniversityVis() {
	var paddingObj = {
		"top": 40,
		"bottom": 20,
		"left": 70,
		"right": 20
	}
	var matrixLineHeight = 19;
	var width = 500;
	var breadcrumbWidth = 600, breadcrumbHeight = 30;
	var height = fullPublicCourseDataset.values.length * matrixLineHeight;
	var maximumCircleRadius = 120;
	var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015];

	//Create matrix visualization space
	var svg = d3.select("#universityVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.on("contextmenu", function() {
			d3.event.preventDefault();
			drawContextMenu(d3.mouse(this)[0], d3.mouse(this)[1],menuItems);
		});

	//Creat breadcrumb space
	d3.select("#universityBreadcrumb").append("svg")
		.attr("width", breadcrumbWidth)
		.attr("height", breadcrumbHeight);

	//Scale for the unemployment circles
	var circleScale = d3.scaleLinear().domain([0, 100]).range([0, maximumCircleRadius]);
	var xscale = d3.scalePoint().domain(years).range([paddingObj.left + paddingObj.right, width - paddingObj.right]);
	var yscale = d3.scalePoint().domain(fullPublicCourseDataset.values.map(function(d) {
		return d.key;
	})).range([paddingObj.top, height - paddingObj.bottom]);

	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale).tickFormat(function(d) {
		return getAcronym(d);
	});

	//Add yaxis label
	svg.append("text").attr("class", "axisLabel yaxisLabelMatrix");
	//Add axis
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + paddingObj.top / 2 + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + paddingObj.left + ",0)").call(yaxis);
	svg.select(".yaxis").selectAll(".tick").append("title").text(function(d) {
		return d;
	});

	universityVisObj.width = width;
	universityVisObj.publicUniversities = true;
	universityVisObj.matrixLineHeight = matrixLineHeight;
	universityVisObj.paddingObj = paddingObj;
	universityVisObj.svg = svg;
	universityVisObj.circleScale = circleScale;
	universityVisObj.xaxis = xaxis;
	universityVisObj.yaxis = yaxis;
	universityVisObj.previousCollections = [fullPublicCourseDataset];
	universityVisObj.currentCollIndex = 0;

	//Enter/update the data in visualization
	updateUniversityVisualization(universityVisObj, fullPublicCourseDataset.values);
}

/* ########################## Interaction Events ############################# */

function registerEventsUniversityVis() {

	function lineWay() {
		selectMatrixLine(d3.select(this).attr("id"));
	}

	function tickWay() {
		selectMatrixLine(d3.select(this).select("title").text());
	}

	function selectMatrixLine(selectedItemId) {
		var currentCollection = universityVisObj.previousCollections[universityVisObj.currentCollIndex];
		var newCollection;

		if (universityVisObj.currentCollIndex < 2) {
			for (var i = 0; i < currentCollection.values.length; i++) {
				if (currentCollection.values[i].key === selectedItemId) {
					newCollection = currentCollection.values[i].values;
					break;
				}
			}
			newCollection.sort(function(d1, d2) {
				return d2.MediaDesemprego - d1.MediaDesemprego;
			});
			universityVisObj.currentCollIndex++;
			universityVisObj.previousCollections.push({
				"key": selectedItemId,
				"values": newCollection
			});

			updateUniversityVisualization(universityVisObj, newCollection);
		} else {
			for (var i = 0; i < currentCollection.values.length; i++) {
				if (currentCollection.values[i].key === selectedItemId) {
					var sendData = currentCollection.values[i].data;
					dispatch.call("selectCourse", sendData, sendData);
					break;
				}
			}
		}
	}

	d3.selectAll(".matrixLine").on("click", lineWay);
	d3.select(".yaxis").selectAll(".tick").on("click", tickWay);
}

//#############################################################################
//#             				 		                                      #
//#             			  SUNBURST AREA VIEW                              #
//#             				       			                              #
//#############################################################################

/*###################### SUNBURST BREADCRUMB FUNCTIONS #######################*/

var breadcrumbObject = new Object();
breadcrumbObject.clear = function(){
	this.data = [{"currentAreaName" : "All Areas"}];
};
breadcrumbObject.addArea = function (areaName){
	this.data.push(areaName);
};
breadcrumbObject.goToArea = function (areaName){
	
};
breadcrumbObject.clear();

/*########################### SUNBURST FUNCTIONS #############################*/

/* DONT DELETE IT YET  

function updateSunburst(year) {
	var sendObject = { "area": 0, "color": color1(0) };
	dispatch.call("selectArea", sendObject, sendObject);
	
	d3.json("Areas" + year + ".json", function(error, root) {
		if (error) throw error;

		root = d3.hierarchy(root);
		root.sum(function(d) {
			if (d.CNAEFNome == "Raíz")
				return 0;
			var n = d.CNAEF.toString();
			if (n.endsWith("0")) {
				return 0;
			} else
				return d.TotalDesempregados;
		});

		
		d3.select("#sunburst").select("g").selectAll("path")
			.data(partition(root).descendants(),function(d){ return d.data.CNAEFNome; })
			.transition().duration(2000)
			.attr("d", arc)
			.attr("class", "sunburst")
			.style("fill",
				function(d) {
					if (d.data.CNAEFNome == "Raíz")
						return color1(0);
					else {
						var first = Math.floor(d.data.CNAEF / 100);
						var code = d.data.CNAEF.toString();
						if (code[1] == "0") {
							return d3.rgb(color1(first))
						} else if (code[2] == "0") {
							return d3.rgb(color1(first)).brighter(0.5);
						} else {
							return d3.rgb(color1(first)).brighter(1);
						}
					}


				});
		
		d3.select("#sunburst").select("g").selectAll("path").on("click", click)
			.select("title")
			.text(function(d) {
				if (d.data.CNAEFNome == "Raíz")
					return "Total Unemployed (All Areas): " + d.value;
				var res = "Area: "+ d.data.CNAEFNome;
				res += "\nUnemployment %: " + d.data.PercentagemDesemprego + " %";
				res += "\nTotal Unemployed: " + d.data.TotalDesempregados;
				res += "\nTotal Graduates: " + d.data.TotalDiplomados;
				return res;
			});

				
	});
	d3.select(self.frameElement).style("height", height + "px");
}
*/

drawSunburst("2007");

function drawSunburst(year) {
	var sendObject = { "area": 0, "color": color1(0) };
	dispatch.call("selectArea", sendObject, sendObject);
	
	var width = 540,
		height = 540,
		radius = (Math.min(width, height) / 2) - 10;

	var formatNumber = d3.format(",d");

	var x = d3.scaleLinear()
		.range([0, 2 * Math.PI]);

	var y = d3.scaleSqrt()
		.range([0, radius]);

	var partition = d3.partition();

	var arc = d3.arc()
		.startAngle(function(d) {
			return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
		})
		.endAngle(function(d) {
			return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
		})
		.innerRadius(function(d) {
			return Math.max(0, y(d.y0));
		})
		.outerRadius(function(d) {
			return Math.max(0, y(d.y1));
		});


	var svg = d3.select("#areaVis").append("svg")
		.attr("id", "sunburst")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + width / 2 + "," + ((height) / 2) + ")");



	d3.json("Areas" + year + ".json", function(error, root) {
		if (error) throw error;

		root = d3.hierarchy(root);
		root.sum(function(d) {
			if (d.CNAEFNome == "Raíz")
				return 0;
			var n = d.CNAEF.toString();
			if (n.endsWith("0")) {
				return 0;
			} else
				return d.TotalDesempregados;
		});
		svg.selectAll("path")
			.data(partition(root).descendants())
			.enter().append("path")
			.attr("d", arc)
			.attr("class", "sunburst")
			.style("fill",
				function(d) {
					if (d.data.CNAEFNome == "Raíz")
						return color1(0);
					else {
						var first = Math.floor(d.data.CNAEF / 100);
						var code = d.data.CNAEF.toString();
						if (code[1] == "0") {
							return d3.rgb(color1(first))
						} else if (code[2] == "0") {
							return d3.rgb(color1(first)).brighter(0.5);
						} else {
							return d3.rgb(color1(first)).brighter(1);
						}
					}


				})

		.on("click", click)
			.append("title")
			.text(function(d) {
				if (d.data.CNAEFNome == "Raíz")
					return "Total Desempregados: " + d.value;
				var res = d.data.CNAEFNome + "\nPercentagem Desemprego: " + d.data.PercentagemDesemprego + " %";
				res += "\nTotal Desempregados: " + d.data.TotalDesempregados;
				res += "\nTotal Dimplomados: " + d.data.TotalDiplomados;
				return res;
			});
		
		d3.select("#areaBreadcrumb")
			.append("svg")
			.attr("height",30)
			.attr("width",300);
			
		drawBreadcrumbs(d3.select("#areaBreadcrumb").select("svg"),
			breadcrumbObject.data,"currentAreaName",null,rootDataColor,breadcrumbDim);

	});

	function click(d) {
		//Send area selection
		var sendObject = new Object();
		sendObject.area = d.data.CNAEF;
		sendObject.color = this.style.fill;
		if (d.data.CNAEFNome === "Raíz"){
			sendObject.area = 0;			//ROOT is 0
		}
		dispatch.call("selectArea", sendObject, sendObject);

		svg.transition()
			.duration(750)
			.tween("scale", function() {
				var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
					yd = d3.interpolate(y.domain(), [d.y0, 1]),
					yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
				return function(t) {
					x.domain(xd(t));
					y.domain(yd(t)).range(yr(t));
				};
			})
			.selectAll("path")
			.attrTween("d", function(d) {
				return function() {
					return arc(d);
				};
			});
			
		drawBreadcrumbs(d3.select("#areaBreadcrumb").select("svg"),
			breadcrumbObject.data,"currentAreaName",null,this.style.fill,breadcrumbDim);
	}

	d3.select(self.frameElement).style("height", height + "px");

	function computeTextRotation(d) {
		return (x(d.x0 + d.x1 / 2) - Math.PI / 2) / Math.PI * 180;
	}

	function colour(d) {
		if (d.children) {
			// There is a maximum of two children!
			var colours = d.children.map(colour),
				a = d3.hsl(colours[0]),
				b = d3.hsl(colours[1]);
			// L*a*b* might be better here...
			return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
		}
		return d.colour || "#fff";
	}

}

//Generate Slider
genSlider();

function genSlider() {
	var Width = 550;
	var svg = d3.select("#areaSlider").append("svg").attr("width",Width);
	var	margin = {
			right: 50,
			left: 50
		},
		width = Width - margin.left - margin.right;

	var x = d3.scaleLinear()
		.domain([2007, 2015])
		.range([0, width])
		.clamp(true);

	var slider = svg.append("g")
		.attr("class", "slider")
		.attr("transform", "translate(" + margin.left + "," + 9 + ")");

	slider.append("line")
		.attr("class", "track")
		.attr("x1", x.range()[0])
		.attr("x2", x.range()[1])
		.select(function() {
			return this.parentNode.appendChild(this.cloneNode(true));
		})
		.attr("class", "track-inset")
		.select(function() {
			return this.parentNode.appendChild(this.cloneNode(true));
		})
		.attr("class", "track-overlay")
		.call(d3.drag()
			.on("start.interrupt", function() {
				slider.interrupt();
			})
			.on("end drag", function() {
				dragEnd();
			})
			.on("start drag", function() {
				drag();
			}));

	slider.insert("g", ".track-overlay")
		.attr("class", "ticks")
		.attr("transform", "translate(0," + 18 + ")")
		.selectAll("text")
		.data(x.ticks(10))
		.enter().append("text")
		.attr("x", x)
		.attr("text-anchor", "middle")
		.text(function(d) {
			return d
		});

	var handle = slider.insert("circle", ".track-overlay")
		.attr("class", "handle")
		.attr("r", 9);

	function drag() {
		handle.attr("cx", x(x.invert(d3.event.x)));

	}

	function dragEnd() {
		handle.attr("cx", x(x.invert(value(d3.event.x, width))));
		d3.select("#sunburst").remove();
		drawSunburst(year(d3.event.x, width));
	}
}

function value(x, w) {
	var s = w / 8;
	var h = s / 2;
	if (x < h)
		return 0;
	if (x >= h && x < s + h)
		return s;
	if (x >= 2 * s - h && x < 2 * s + h)
		return 2 * s;
	if (x >= 3 * s - h && x < 3 * s + h)
		return 3 * s;
	if (x >= 4 * s - h && x < 4 * s + h)
		return 4 * s;
	if (x >= 5 * s - h && x < 5 * s + h)
		return 5 * s;
	if (x >= 6 * s - h && x < 6 * s + h)
		return 6 * s;
	if (x >= 7 * s - h && x < 7 * s + h)
		return 7 * s;
	if (x >= 8 * s - h)
		return 8 * s;

}

function year(x, w) {
	var s = w / 8;
	var h = s / 2;
	if (x < h)
		return 2007;
	if (x >= h && x < s + h)
		return 2008;
	if (x >= 2 * s - h && x < 2 * s + h)
		return 2009;
	if (x >= 3 * s - h && x < 3 * s + h)
		return 2010;
	if (x >= 4 * s - h && x < 4 * s + h)
		return 2011;
	if (x >= 5 * s - h && x < 5 * s + h)
		return 2012;
	if (x >= 6 * s - h && x < 6 * s + h)
		return 2013;
	if (x >= 7 * s - h && x < 7 * s + h)
		return 2014;
	if (x >= 8 * s - h)
		return 2015;

}

//#############################################################################
//#             				 		                                      #
//#             		   COURSE LINE CHART VIEW                             #
//#             				       			                              #
//#############################################################################

var lineChartObj = new Object();

generateLineChartVis();

//Receive event from selecting course in courses view
dispatch.on("selectCourse", function(d) {
	updateLineChartVis(d);
});

//Update the line chart visualization with new data
function updateLineChartVis(collection) {
	var line = d3.line()
		.x(function(d) {
			return lineChartObj.xscale(d.Ano);
		})
		.y(function(d) {
			return lineChartObj.yscale(d.PercentagemDesemprego);
		});

	//Add the new data
	d3.select("#lineChartVis").select("svg")
		.append("path")
		.datum(collection)
		.attr("class", "line")
		.attr("d", line)
		.append("title").text(function(d) {
			var res = "";
			res += "University: " + d[0].NomeUniversidade;
			res += "\nCollege: " + d[0].NomeFaculdade;
			res += "\nCourse: " + d[0].key;
			return res;
		});
}

//Initialize the Line Chart Visualization
function generateLineChartVis() {
	var height = 235;
	var width = 1250;
	var padding = {
		"top": 4,
		"bottom": 40,
		"left": 40,
		"right": 15
	};

	var svg = d3.select("#lineChartVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	var xscale = d3.scaleLinear().domain([2007,2015]).range([padding.left, width - padding.right]);
	var yscale = d3.scaleLinear().domain([100, 0]).range([padding.top, height - padding.bottom]);

	var xaxis = d3.axisBottom().tickFormat(d3.format("0000")).scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (height - padding.bottom) + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + padding.left + ",0)").call(yaxis);

	lineChartObj.xscale = xscale;
	lineChartObj.yscale = yscale;

	svg.append("text")
		.attr("class", "axisLabel")
		.attr("x", -(height + 80) / 2)
		.attr("y", padding.right)
		.attr("transform", "rotate(-90)")
		.text("Unemployment %");
	svg.append("text")
		.attr("class", "axisLabel")
		.attr("x", width / 2)
		.attr("y", height - padding.top)
		.text("Year");
}

//#############################################################################
//#             				 		                                      #
//#                      COURSE SCATTER PLOT CHART VIEW                       #
//#             				       			                              #
//#############################################################################

/* Return the string to show in tooltip */
function getScatterPlotTooltip(datum) {
	var res = "";
	res += "College: " + datum.NomeFaculdade;
	res += "\nCourse: " + datum.NomeCurso;
	res += "\nEntry Grade: " + datum.Nota;
	return res;
}

/* Return true if a is a sub-area of b, false otherwise */
function subArea(a, b) {
	var a_ = a.toString();
	var b_ = b.toString();
	if (b == 0){	// 0 is the Root(All areas)
		return true;
	}
	else if (b_.substring(1, 3) == "00"){
		return a_[0] == b_[0];
	}
	else if (b_[2] == "0"){
		return a_.substring(0, 2) == b_.substring(0, 2);
	}
	else{
		return a_ == b_;
	}
}

var fullScatterDataset; 			//All the data from the entry grades file

var scatterVisObj = new Object();	//Scatter plot vis object

//Load the Scatter Plot Courses data and prepare it to be used in visualization
d3.json("EntryGrades.json", function(data) {
	fullScatterDataset = data.data;
	generateScatterVis();
});

//Receive event from view change in the sunburst view (Area Selected)
dispatch.on("selectArea", function(selectedObject, dummy) {	
	scatterVisObj.selectedArea = selectedObject;
	filterScatterVis();
});

//Receive event from view change in university/college matrix view
dispatch.on("selectUniversity", function(selected, dummy) {
	scatterVisObj.selectedUniversity = selected;
	filterScatterVis();
});

// Update the scatter plot info according with external filtering events
function filterScatterVis(){
	var allUniversitiesData = scatterVisObj.selectedUniversity[0] === "Ensino Público";
	d3.select("#courseScatterVis").select("svg")
		.selectAll("circle")
		.each(function(p, j) {
			d3.select(this)
				.transition().duration(1000)
				.attr("fill", function(d) {
					var res = "#e6e6e6";		//Not accepted by filter
					if(allUniversitiesData){	//All Universities Data
						if (subArea(d.CNAEF,scatterVisObj.selectedArea.area)) {
							res = scatterVisObj.selectedArea.color;
						}
						return res;						
					}
					else {						//University/College selected
						var university = true;
						for (var i = 0; i < scatterVisObj.selectedUniversity.length; i++) {
							if (!d.NomeFaculdade.includes(scatterVisObj.selectedUniversity[i])) {
								university = false;
								break;
							}
						}
						if(university && subArea(d.CNAEF,scatterVisObj.selectedArea.area)){
							res = scatterVisObj.selectedArea.color;
						}
					}
					return res;
				});
		});
}

//Draw/update the scatter plot
function updateScatterVis(newCollection) {
	var dotRadius = 2.5;

	//Enter/update the data
	d3.select("#courseScatterVis").select("svg")
		.selectAll("circle")
		.data(newCollection)
		.enter().append("circle")
		.attr("r", function(d) {
			if (d.PercentagemDesemprego < 0) {
				return 0;
			} else {
				return dotRadius;
			}
		})
		.attr("cx", function(d) {
			return scatterVisObj.xscale(d.Nota / 10);
		})
		.attr("cy", function(d) {
			return scatterVisObj.yscale(d.PercentagemDesemprego);
		})
		.append("title").text(function(d) {
			return getScatterPlotTooltip(d);
		});
}

function generateScatterVis() {
	var height = 580;
	var width = 620;
	var padding = {
		"top": 10,
		"bottom": 40,
		"left": 40,
		"right": 10
	};
	//Create the svg to the scatter plot
	var svg = d3.select("#courseScatterVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	var xscale = d3.scaleLinear().domain([9.5, 19]).range([padding.left, width - padding.right]);
	var yscale = d3.scaleLinear().domain([90, 0]).range([padding.top, height - padding.bottom]);

	scatterVisObj.width = width;
	scatterVisObj.height = height;
	scatterVisObj.xscale = xscale;
	scatterVisObj.yscale = yscale;
	scatterVisObj.padding = padding;
	scatterVisObj.selectedUniversity = ["Ensino Público"];
	scatterVisObj.selectedArea = { "area": 0, "color": color1(0) };
	
	updateScatterVis(fullScatterDataset);

	var xaxis = d3.axisBottom().scale(xscale).ticks(19);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (height - padding.bottom) + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + padding.left + ",0)").call(yaxis);
	svg.append("text")
		.attr("class", "axisLabel")
		.attr("x", -height / 2)
		.attr("y", 12)
		.attr("transform", "rotate(-90)")
		.text("Unemployment %");
	svg.append("text")
		.attr("class", "axisLabel")
		.attr("x", (width - 100) / 2)
		.attr("y", height - 10)
		.text("Course Minimum Entry Grade");
}

//#############################################################################
//#############################################################################
//#############################################################################
//#############################################################################