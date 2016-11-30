//#############################################################################
//#             				 		                                      #
//#             		   			GLOBAL CODE 	                          #
//#             				       			                              #
//#############################################################################

//Register events to use in inter-view communication
/*
	
*/
var dispatch = d3.dispatch("selectCourse", "selectUniversity", "unselectUniversity");

//#############################################################################
//#             				 		                                      #
//#             		   UNIVERSITY AND COURSES VIEW                        #
//#             				       			                              #
//#############################################################################

//######################## Auxiliary functions ################################

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

function dataToString(d) {
	var res = "Percentagem Desemprego: " + d.PercentagemDesemprego.toFixed(2) + "%";
	res += "\nTotal Desempregados: " + d.TotalDesempregados;
	res += "\nTotal Dimplomados: " + d.TotalDiplomados;
	return res;
}

//######################## Visualization Functions #########################

var fullPublicCourseDataset; //All the public courses dataset
var fullPrivateCourseDataset; //All the private courses dataset

var universityVisObj = new Object();

var breadcrumbDim = {
	w: 195,
	h: 30,
	s: 3,
	t: 10
};

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

//Return a string with all the points of a breadcrumb item. 
function breadcrumbPoints(d, i) {
	var points = [];
	points.push("0,0");
	points.push(breadcrumbDim.w + ",0");
	points.push(breadcrumbDim.w + breadcrumbDim.t + "," + (breadcrumbDim.h / 2));
	points.push(breadcrumbDim.w + "," + breadcrumbDim.h);
	points.push("0," + breadcrumbDim.h);
	if (i > 0) {
		points.push(breadcrumbDim.t + "," + (breadcrumbDim.h / 2));
	}
	return points.join(" ");
}

// Draw/update the matrix breadcrumbs
function drawBreadcrumbs(nodeArray) {
	var breadcrumbClick = function(d, i) {
		var removeCount = universityVisObj.previousCollections.length - (i + 1)
		for (var k = 0; k < removeCount; k++) {
			universityVisObj.previousCollections.pop();
			universityVisObj.currentCollIndex--;
		}
		updateUniversityVisualization(universityVisObj, universityVisObj.previousCollections[universityVisObj.currentCollIndex].values);
	}

	var g = d3.select("#universityTrail")
		.selectAll("g")
		.data(nodeArray, function(d) {
			return d.key;
		});

	var entering = g.enter()
		.append("g")
		.attr("transform", function(d, i) {
			return "translate(" + i * (breadcrumbDim.w + breadcrumbDim.s) + ", 0)";
		});

	entering
		.append("polygon")
		.on("click", breadcrumbClick)
		.transition().duration(500)
		.attr("points", breadcrumbPoints)
		.attr("class", "breadcrumbItem")
		.style("fill", function(d) {
			return "steelblue";
		});

	entering.append("text")
		.on("click", breadcrumbClick)
		.attr("x", (breadcrumbDim.w + breadcrumbDim.t) / 2)
		.attr("y", breadcrumbDim.h / 2)
		.attr("dy", "0.35em")
		.attr("text-anchor", "middle")
		.attr("class", "breadcrumbItem")
		.text(function(d) {
			return getBreadcrumbString(d.key);
		});

	g.exit().transition().duration(200).remove()
}

/*######################## Context Menu Functions ########################*/

function drawContextMenu(x, y) {
	//Remove the current menu if we open it in other place	
	d3.select('.context-menu').remove();

	var menuItemHeight = 25;
	var menuItemWidth = 150;
	// Draw the menu
	universityVisObj.svg
		.append('g').attr('class', 'context-menu')
		.selectAll('tmp')
		.data(universityVisObj.contextMenuItems).enter()
		.append('g')
		.attr('class', 'menu-entry')
		.on("click", function() { //Context menu click actions
			if (d3.select(this).select("text").text() === "Sort Ascending") {
				universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
					return d1.MediaDesemprego - d2.MediaDesemprego;
				});
			} else if (d3.select(this).select("text").text() === "Sort Descending") {
				universityVisObj.previousCollections[universityVisObj.currentCollIndex].values.sort(function(d1, d2) {
					return d2.MediaDesemprego - d1.MediaDesemprego;
				});
			} else if (d3.select(this).select("text").text() === "Public Courses" ||
				d3.select(this).select("text").text() === "Private Courses") {
				if (universityVisObj.publicUniversities) {
					universityVisObj.publicUniversities = false;
					universityVisObj.contextMenuItems[1] = "Public Courses";
					universityVisObj.previousCollections = [fullPrivateCourseDataset];
					universityVisObj.currentCollIndex = 0;
				} else {
					universityVisObj.publicUniversities = true;
					universityVisObj.contextMenuItems[1] = "Private Courses";
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

	// Other interactions remove the menu!!
	d3.select("body")
		.on("click", function() {
			d3.select(".context-menu").remove();
		});
}

function updateYaxisLabel(newHeight){
	var labelWidth = 60;
	var label = "";
	if(universityVisObj.currentCollIndex == 0){
		label = "Universities";
	}
	else if(universityVisObj.currentCollIndex == 1){
		label = "Colleges";
	}
	else if(universityVisObj.currentCollIndex == 2){
		label = "Courses";
	}
	universityVisObj.svg.select(".yaxisLabelMatrix")
		.transition()
		.duration(1000)
		.attr("y",universityVisObj.paddingObj.left / 6)
		.attr("x", - (newHeight + labelWidth) / 2)
		.attr("transform", "rotate(-90)")
		.text(label);
}

//Call to update university (Bertin Matrix) visualization
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
		.attr("class","matrixLine")
		.attr("id",function(d) {
			return d.key;
		})
		.attr("x",universityVisObj.paddingObj.left)
		.attr("y",function(d) {
			return universityVisObj.yaxis.scale()(d.key) - (universityVisObj.matrixLineHeight / 2);
		})
		.attr("width",universityVisObj.width - universityVisObj.paddingObj.right)
		.attr("height",universityVisObj.matrixLineHeight);
	
	groupLine.selectAll("circle")
		.data(function(d) {
			return d.data;
		})
		.enter().append("circle")
		.on("contextmenu", function() {
			d3.event.preventDefault();
			drawContextMenu(d3.mouse(this)[0], d3.mouse(this)[1]);
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
		});

	universityVisObj.svg
		.selectAll("g.data")
		.selectAll("circle")
		.append("title").text(function(dy) {
			return dataToString(dy);
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

	dispatch.call("selectUniversity", currentSelection, currentSelection);

	drawBreadcrumbs(universityVisObj.previousCollections);

	updateYaxisLabel(newHeight);
	
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
	var matrixLineHeight = 17.2;
	var width = 500;
	var breadcrumbWidth = 600;
	var height = fullPublicCourseDataset.values.length * matrixLineHeight;
	var maximumCircleRadius = 90;
	var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015];

	//Create matrix visualization space
	var svg = d3.select("#universityVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.on("contextmenu", function() {
			d3.event.preventDefault();
			drawContextMenu(d3.mouse(this)[0], d3.mouse(this)[1]);
		});
		
	//Creat breadcrumb space
	d3.select("#universityBreadcrumb").append("svg")
		.attr("width", breadcrumbWidth)
		.attr("height", breadcrumbDim.h)
		.attr("id", "universityTrail");
		
	//Scale for the unemployment circles
	var circleScale = d3.scaleLinear().domain([0, 100]).range([0, maximumCircleRadius]);
	var xscale = d3.scalePoint().domain(years).range([paddingObj.left + paddingObj.right, width - paddingObj.right]);
	var yscale = d3.scalePoint().domain(fullPublicCourseDataset.values.map(function(d) {
		return d.key;
	})).range([paddingObj.top, height - paddingObj.bottom]);

	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale).tickFormat(function(d) {
		return getAcronym(d) + " +";
	});
	
	//Add yaxis label
	svg.append("text").attr("class","axisLabel yaxisLabelMatrix");
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
	universityVisObj.contextMenuItems = ["Back", "Private Courses", "Sort Ascending", "Sort Descending"];
	
	//Enter/update the data in visualization
	updateUniversityVisualization(universityVisObj, fullPublicCourseDataset.values);
}

/* ########################## Interaction Events ############################# */
function registerEventsUniversityVis() {
	
	function lineWay(){
		selectMatrixLine(d3.select(this).attr("id"));
	}
	
	function tickWay(){
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
//#             				 AREA VIEW                                    #
//#             				       			                              #
//#############################################################################


drawSunburst("2007");

function drawSunburst(year) {
	var width = 550,
		height = 550,
		radius = (Math.min(width, height) / 2) - 10;

	var formatNumber = d3.format(",d");

	var x = d3.scaleLinear()
		.range([0, 2 * Math.PI]);

	var y = d3.scaleSqrt()
		.range([0, radius]);

	var color = d3.scaleOrdinal(d3.schemeCategory10);

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
		.attr("class", "col-md-offset-3")
		.append("g")
		.attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");



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
			.style("fill", function(d) {
				if (d.data.CNAEFNome == "Raíz")
					return color(0);
				else {
					var first = (d.children ? d : d.parent).data.CNAEF / 100;
					return color(Math.floor(first) + 1);
				}
				alert(first);
				return color(1);
			})
			.on("click", click)
			.append("title")
			.text(function(d) {
				var res = d.data.CNAEFNome + "\nPercentagem Desemprego: " + d.data.PercentagemDesemprego + " %";
				res += "\nTotal Desempregados: " + d.data.TotalDesempregados;
				res += "\nTotal Dimplomados: " + d.data.TotalDiplomados;
				return res;
			});


	});

	function click(d) {
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
	}

	d3.select(self.frameElement).style("height", height + "px");

	function computeTextRotation(d) {
		return (x(d.x0 + d.x1 / 2) - Math.PI / 2) / Math.PI * 180;
	}

}

//Slider
genSlider();

function genSlider() {
	var Width = 400;
	var Height = 100;
	var svg = d3.select("#slider"),
		margin = {
			right: 50,
			left: 50
		},
		width = +Width - margin.left - margin.right,
		height = +Height;

	var x = d3.scaleLinear()
		.domain([2007, 2015])
		.range([0, width])
		.clamp(true);

	var slider = svg.append("g")
		.attr("class", "slider")
		.attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

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
		console.log(year(d3.event.x));
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
			res += "-> " + d[0].NomeUniversidade;
			res += "\n--> " + d[0].NomeFaculdade;
			res += "\n---> " + d[0].key;
			return res;
		});
}

function generateLineChartVis() {
	var height = 330;
<<<<<<< HEAD
	var width = 620;
	var padding = {
		"top": 10,
		"bottom": 40,
		"left": 40,
		"right": 15
	};

=======
	var width = 1250;
	var padding = { "top": 10,"bottom": 40, "left": 40, "right": 15 };
	
>>>>>>> origin/master
	var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015];

	var svg = d3.select("#lineChartVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	var xscale = d3.scalePoint().domain(years).range([padding.left, width - padding.right]);
	var yscale = d3.scaleLinear().domain([100, 0]).range([padding.top, height - padding.bottom]);

	var xaxis = d3.axisBottom().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (height - padding.bottom) + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + padding.left + ",0)").call(yaxis);

	lineChartObj.xscale = xscale;
	lineChartObj.yscale = yscale;

	svg.append("text")
<<<<<<< HEAD
		.attr("x", -200)
		.attr("y", 12)
=======
		.attr("class","axisLabel")
		.attr("x", - height / 2)
		.attr("y", padding.right)
>>>>>>> origin/master
		.attr("transform", "rotate(-90)")
		.text("Unemployment %");
	svg.append("text")
		.attr("class","axisLabel")
		.attr("x", width / 2)
		.attr("y", height - padding.top)
		.text("Year");
}

//#############################################################################
//#             				 		                                      #
//#                      COURSE SCATTER PLOT CHART VIEW                       #
//#             				       			                              #
//#############################################################################

function getScatterPlotDotToolTip(datum) {
	var res = "";
	res += "Faculdade: " + datum.NomeFaculdade;
	res += "\nCurso: " + datum.NomeCurso;
	res += "\nNota: " + datum.Nota;
	return res;
}

var fullScatterDataset; //All the data from the entry grades file

var scatterVisObj = new Object();

//Load the ScatterPlot Courses data and prepare it to be used in visualization
d3.json("EntryGrades.json", function(data) {
	fullScatterDataset = data.data;
	generateScatterVis();
});

//Receive event from view change in university/faculdade matrix view
dispatch.on("selectUniversity", function(selected, dummy) {
	//University or college selected
	var filterWidth = 200;
	var filterHeight = 22;
	
	if (selected[0] !== "Ensino Público" && selected[0] !== "Ensino Privado") {
		d3.select("#courseScatterVis").select("svg")
			.selectAll("circle")
			.each(function(p, j) {
				d3.select(this)
					.transition().duration(1000)
					.attr("class", function(d) {
						var res = "selectedDot";
						for (var i = 0; i < selected.length; i++) {
							if (!d.NomeFaculdade.includes(selected[i])) {
								res = "unselectedDot";
								break;
							}
						}
						return res;
					});
			});
		/* TODO!!!
		var g = d3.select("#courseScatterVis").select("svg")
			.append("g");
			
		g.append("rect")
			.attr("width",filterWidth)
			.attr("height",filterHeight)
			.attr("x",scatterVisObj.width - filterWidth)
			.attr("y",scatterVisObj.top)
			.attr("fill","steelblue");
		g.append("text")
			.attr("x",scatterVisObj.width - filterWidth)
			.attr("y",scatterVisObj.top)
			.text("dummy");
			*/
	}
	//Nothing selected
	else {
		d3.select("#courseScatterVis").select("svg")
			.selectAll("circle")
			.attr("class", "dot");
	}
});

function updateScatterVis(newCollection) {
	var dotRadius = 2;

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
			return getScatterPlotDotToolTip(d);
		});
}

function generateScatterVis() {
	var height = 550;
	var width = 620;
	var padding = {
		"top": 10,
		"bottom": 40,
		"left": 40,
		"right": 10
	};

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
	
	updateScatterVis(fullScatterDataset);

	var xaxis = d3.axisBottom().scale(xscale).ticks(19);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (height - padding.bottom) + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + padding.left + ",0)").call(yaxis);
	svg.append("text")
<<<<<<< HEAD
		.attr("x", -200)
=======
		.attr("class","axisLabel")
		.attr("x", - height / 2)
>>>>>>> origin/master
		.attr("y", 12)
		.attr("transform", "rotate(-90)")
		.text("Unemployment %");
	svg.append("text")
		.attr("class","axisLabel")
		.attr("x", (width - 100) / 2)
		.attr("y", height - 10)
		.text("Course Minimum Entry Grade");
}

//#############################################################################
//#############################################################################
//#############################################################################
//#############################################################################