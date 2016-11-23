//#############################################################################
//#             				 		                                      #
//#             		   			GLOBAL CODE 	                       #
//#             				       			                              #
//#############################################################################

var dispatch = d3.dispatch("selectCourse");

//#############################################################################
//#             				 		                                      #
//#             		   UNIVERSITY AND COURSES VIEW                        #
//#             				       			                              #
//#############################################################################

//######################## Auxiliary functions ################################

//Return the acronym of the name
function getAcronym(name) {
	var res = "";
	var tokens = name.split(" ");
	for (var i = 0; i < tokens.length; i++) {
		if (tokens[i][0] != null && tokens[i][0].match(/[A-Z]|-/)) {
			res += tokens[i][0];
		}
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

var fullPublicCourseDataset; 	//All the public courses dataset
var fullPrivateCourseDataset; 	//All the private courses dataset
var currentCourseDataset; 		//The current course dataset seen [public or private]	
var activeCourseSubsetDataset;	//Universities or Sub-Universities or Courses

var universityVisObj = new Object();

// Load all the course data!
d3.json("CoursesPublic.json", function(data1) {
	d3.json("CoursesPrivate.json", function(data2) {
		fullPrivateCourseDataset = data2;
	});
	fullPublicCourseDataset = data1;
	activeCourseSubsetDataset = currentCourseDataset = data1;
	activeCourseSubsetDataset.sort(function(d1, d2) {
		return d2.MediaDesemprego - d1.MediaDesemprego;
	});
	generateUniversityVis();
});

function contextMenu(x, y) {
	//Remove the current menu if we open it in other place	
	d3.select('.context-menu').remove();

	var menuItemHeight = 25;
	var menuItemWidth = 150;
	// Draw the menu
	universityVisObj.svg
		.append('g').attr('class', 'context-menu')
		.selectAll('tmp')
		.data(universityVisObj.contextMenuItems).enter()
		.append('g').attr('class', 'menu-entry');
	
	d3.selectAll('.menu-entry')
		.append('rect')
		.attr('x', x)
		.attr('y', function(d, i){ return y + (i * menuItemHeight); })
		.attr('width', menuItemWidth)
		.attr('height', menuItemHeight);
	
	d3.selectAll(".menu-entry")
		.append("text")
		.text(function(d){ return d; })
		.attr("class","menu-entry text")
		.attr("x", x)
		.attr("y", function(d, i){ return y + (i * menuItemHeight); })
		.attr("dy", menuItemHeight - 5 / 2)
		.attr("dx", 5)
		.on("click", function() {		//Context menu click actions
			if(d3.select(this).text() === "Sort Ascending"){
				activeCourseSubsetDataset.sort(function(d1, d2) {
					return d1.MediaDesemprego - d2.MediaDesemprego;
				});
			}
			else if(d3.select(this).text() === "Sort Descending"){
				activeCourseSubsetDataset.sort(function(d1, d2) {
					return d2.MediaDesemprego - d1.MediaDesemprego;
				});
			}
			else{
				if (universityVisObj.publicUniversities) {
					universityVisObj.publicUniversities = false;
					universityVisObj.contextMenuItems[2] = "Public Courses";
					activeCourseSubsetDataset = currentCourseDataset = fullPrivateCourseDataset;
				} else {
					universityVisObj.publicUniversities = true;
					universityVisObj.contextMenuItems[2] = "Private Courses";
					activeCourseSubsetDataset = currentCourseDataset = fullPublicCourseDataset;
				}
				activeCourseSubsetDataset.sort(function(d1, d2) {
					return d2.MediaDesemprego - d1.MediaDesemprego;
				});
			}
			universityVisObj.level = 0;
			universityVisObj.tokenLevel = [];
			updateUniversityVisualization(universityVisObj, activeCourseSubsetDataset);
		})
		.style({'cursor': 'pointer'});

	// Other interactions remove the menu!!
	d3.select("body")
		.on("click", function() {
			d3.select(".context-menu").remove();
	});
}

//Call to update university (Bertin Matrix) visualization
function updateUniversityVisualization(universityVisObj, newCollection) {
	var minimumHeight = 300;
	var newHeight = newCollection.length * universityVisObj.matrixLineHeight + universityVisObj.padding + 20;
	newHeight = (newHeight < minimumHeight && newCollection.length <= 4) ? minimumHeight : newHeight;
	
	universityVisObj.yscale.domain(newCollection.map(function(d) { return d.key; }))
		.range([universityVisObj.padding + 20, newHeight - universityVisObj.matrixLineHeight]);
	universityVisObj.svg.attr("height", newHeight);

	var transition = d3.transition().duration(1000);
	
	//Select all the matrix data lines and remove them
	universityVisObj.svg.selectAll("g.data").remove();

	//Add new Data
	universityVisObj.svg
		.selectAll("g.data")
		.data(newCollection).enter().append("g")
		.attr("class", "data")
		.attr("y", function(d) { return universityVisObj.yscale(d.key); })
		.selectAll("circle")
		.data(function(d) { return d.data; })
			.enter().append("circle")
			.on("contextmenu", function() { 
				d3.event.preventDefault();
				contextMenu(d3.mouse(this)[0], d3.mouse(this)[1]);
			})
			//.transition(transition)
			.attr("r", function(dy) {
				return Math.sqrt(universityVisObj.circleScale(dy.PercentagemDesemprego));
			})
			.attr("cy", function(dy) {
				return universityVisObj.yscale(dy.key);
			})
			.attr("cx", function(dy) {
				return universityVisObj.xscale(dy.Ano);
			})
			.append("title").text(function(dy) {
				return dataToString(dy);
			});

	//Update yaxis labels due to new elements
	universityVisObj.svg.selectAll(".yaxis").transition().duration(1000).call(universityVisObj.yaxis);
	universityVisObj.svg.selectAll(".tick").append("title").text(function(d) {
		return d;
	});
	//Register Interaction events to the new elements!!
	registerEventsUniversityVis();
}

// Code related to University Visualization creation (Bertin Matrix)
function generateUniversityVis() {
	var padding = { "top": 10, "bottom": 10, "left":10, "rigth":10 }
	var matrixLineHeight = 15;
	var width = 400;
	var height = activeCourseSubsetDataset.length * matrixLineHeight + universityVisObj.padding + 20;
	var padding = 20;
	var leftPadding = 50;
	var maximumCircleRadius = 100;
	var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015];

	var svg = d3.select("#universityVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.on("contextmenu", function() { 
				d3.event.preventDefault();
				contextMenu(d3.mouse(this)[0], d3.mouse(this)[1]);
		});
		
	//Add the navigation context header
	svg.append("rect")
		.attr("x",0)
		.attr("y",0)
		.attr("height",25)
		.attr("width",60)
		.attr("class","typeCourse")
		.append("text")
		.text("Ensino Público")
		.attr("class","text");
	
	//Scale for the unemployment circles
	var circleScale = d3.scaleLinear().domain([0, 100]).range([0, maximumCircleRadius]);
	var xscale = d3.scalePoint().domain(years).range([leftPadding + padding, width - leftPadding]);
	var yscale = d3.scalePoint().domain(activeCourseSubsetDataset.map(function(d) {
		return d.key;
	})).range([padding + 20, height - matrixLineHeight]);

	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale).tickFormat(function(d) {
		return getAcronym(d);
	});
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + padding + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + leftPadding + ",0)").call(yaxis);
	svg.selectAll(".tick").append("title").text(function(d) { return d; });

	universityVisObj.publicUniversities = true;
	universityVisObj.matrixLineHeight = matrixLineHeight;
	universityVisObj.padding = padding;
	universityVisObj.leftPadding = leftPadding;
	universityVisObj.svg = svg;
	universityVisObj.circleScale = circleScale;
	universityVisObj.xscale = xscale;
	universityVisObj.yscale = yscale;
	universityVisObj.yaxis = yaxis;
	universityVisObj.level = 0;
	universityVisObj.tokenLevel = [];
	universityVisObj.contextMenuItems = ["Sort Ascending","Sort Descending","Private Courses"];
	
	//Enter/load the data in visualization
	updateUniversityVisualization(universityVisObj, activeCourseSubsetDataset);
}

/* ########################## Interaction Events ############################# */
function registerEventsUniversityVis() {
	// INTERACTION - 
	universityVisObj.svg.select(".yaxis").selectAll(".tick").on("click", function() {
		var selectedItemId = d3.select(this).select("title").text();
		var newCollection;

		if (universityVisObj.level == 0) {
			for (var i = 0; i < currentCourseDataset.length; i++) {
				if (currentCourseDataset[i].key === selectedItemId) {
					newCollection = currentCourseDataset[i].values;
					break;
				}
			}
		} else if (universityVisObj.level == 1) {
			for (var i = 0; i < currentCourseDataset.length; i++) {
				if (currentCourseDataset[i].key === universityVisObj.tokenLevel[universityVisObj.level - 1]) {
					for (var k = 0; k < currentCourseDataset[i].values.length; k++) {
						if (currentCourseDataset[i].values[k].key === selectedItemId) {
							newCollection = currentCourseDataset[i].values[k].values;
							break;
						}
					}
				}
			}
		} else {	//Add to Line Chart !!!!
			for (var i = 0; i < currentCourseDataset.length; i++) {
				if (currentCourseDataset[i].key === universityVisObj.tokenLevel[universityVisObj.level - 2]) {
					for (var k = 0; k < currentCourseDataset[i].values.length; k++) {
						if (currentCourseDataset[i].values[k].key === universityVisObj.tokenLevel[universityVisObj.level - 1]) {
							for(var r = 0; r < currentCourseDataset[i].values[k].values.length;r++){
								if(currentCourseDataset[i].values[k].values[r].key === selectedItemId){
									console.log(selectedItemId);
									sendData = currentCourseDataset[i].values[k].values[r].data;
									dispatch.call("selectCourse",sendData,sendData);
									return;
								}
							}
						}
					}
				}
			}
		}
		activeCourseSubsetDataset = newCollection;
		activeCourseSubsetDataset.sort(function(d1, d2) {
			return d2.MediaDesemprego - d1.MediaDesemprego;
		});
		universityVisObj.level++;
		universityVisObj.tokenLevel.push(selectedItemId);
		updateUniversityVisualization(universityVisObj, activeCourseSubsetDataset);
	});

}

//#############################################################################
//#             				 		                                      #
//#             				 AREA VIEW                                    #
//#             				       			                              #
//#############################################################################

$("#year").change(function() {
	d3.select("#sunburst").remove();
	var y = $("#year").val();
	drawSunburst(y);
});

drawSunburst("2015");

function drawSunburst(year) {
	var width = 550,
		height = 425,
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
		.attr("class", "col-md-offset-2")
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
				if(d.data.CNAEFNome=="Raíz")
					return color(1);
				else{
					var first = (d.children ? d : d.parent).data.CNAEF/100;					
					return color(Math.floor(first)+1);
				}
				alert (first);
				return color(1);
			})
			.on("click", click)
			.append("title")
			.text(function(d) {
				return d.data.CNAEFNome + "\n" + formatNumber(d.value);
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

//#############################################################################
//#             				 		                                      #
//#             		   COURSE LINE CHART VIEW                             #
//#             				       			                              #
//#############################################################################

var lineChartObj = new Object();

generateLineChartVis();

//Receive event from selecting course in courses view
dispatch.on("selectCourse",function(d) {
	updateLineChartVis(d);
});

function updateLineChartVis(collection){
	var line = d3.line()
		.x(function(d) { return lineChartObj.xscale(d.Ano); })
		.y(function(d) { return lineChartObj.yscale(d.PercentagemDesemprego); });
	
	//Add the new data
	d3.select("#lineChartVis").select("svg")
		.append("path")
		.datum(collection)
		.attr("class", "line")
		.attr("d", line)
		.append("title").text(function(d){
			return "TODO";
		});
}

function generateLineChartVis() {
	var height = 200;
	var width = 450;
	var padding = 25;

	var years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015];

	var svg = d3.select("#lineChartVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	var xscale = d3.scalePoint().domain(years).range([padding * 2, width - padding]);
	var yscale = d3.scaleLinear().domain([100, 0]).range([0, height - padding * 2]);

	var xaxis = d3.axisBottom().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (height - padding * 2) + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + padding * 2 + ",0)").call(yaxis);

	lineChartObj.xscale = xscale;
	lineChartObj.yscale = yscale;
	
	svg.append("text")
		.attr("x", -padding * 5)
		.attr("y", padding / 2)
		.attr("transform", "rotate(-90)")
		.text("Unemployment %");
	svg.append("text")
		.attr("x", width - padding * 2)
		.attr("y", height - padding * 1)
		.text("Year");
}

//#############################################################################
//#             				 		                                      #
//#                  COURSE SCATTER PLOT CHART VIEW                           #
//#             				       			                              #
//#############################################################################

function getDotToolTip(d) {
	var res = "";
	res += "Faculdade: " + d.NomeFaculdade;
	res += "\nCurso: " + d.NomeCurso;
	res += "\nNota: " + d.Nota;
	return res;
}

var fullScatterDataset; //All the data from the entry grades file

//Load the ScatterPlot Courses Data and prepare it to be used in Visualization
d3.json("EntryGrades.json", function(data) {
	fullScatterDataset = data.data;
	generateScatterVis();
});

function generateScatterVis() {
	var height = 200;
	var width = 425;
	var padding = 25;
	var dotRadius = 2;

	var svg = d3.select("#courseScatterVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	var xscale = d3.scaleLinear().domain([9.5, 19]).range([padding * 2, width - padding]);
	var yscale = d3.scaleLinear().domain([100, 0]).range([0, height - padding * 2]);

	//Enter the new data
	svg.selectAll("circle")
		.data(fullScatterDataset)
		.enter().append("circle")
		.attr("r", function(d) {
			if (d.PercentagemDesemprego < 0) {
				return 0;
			} else {
				return dotRadius;
			}
		})
		.attr("cx", function(d) {
			return xscale(d.Nota / 10);
		})
		.attr("cy", function(d) {
			return yscale(d.PercentagemDesemprego);
		})
		.append("title").text(function(d) {
			return getDotToolTip(d);
		});
	//==================
	
	var xaxis = d3.axisBottom().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class", "xaxis").attr("transform", "translate(0," + (height - padding * 2) + ")").call(xaxis);
	svg.append("g").attr("class", "yaxis").attr("transform", "translate(" + padding * 2 + ",0)").call(yaxis);
	svg.append("text")
		.attr("x", -padding * 5)
		.attr("y", padding / 2)
		.attr("transform", "rotate(-90)")
		.text("Unemployment %");
	svg.append("text")
		.attr("x", width - padding * 6)
		.attr("y", height - padding * 1)
		.text("Minimum Entry Grade");
}

//#############################################################################
//#############################################################################
//#############################################################################
//#############################################################################