//#############################################################################
//#             				 		                                      #
//#             		   GLOBAL VARIABLES AND CODE                          #
//#             				       			                              #
//#############################################################################

var fullPublicCourseDataset;	//All the public course dataset
var fullPrivateCourseDataset;	//All the private course dataset
var currentCourseDataset;		//The current course dataset seen	
var activeCourseSubsetDataset;

var fullScatterDataset;		//All the data from the entry grades file

//#############################################################################
//#             				 		                                      #
//#             		   UNIVERSITY AND COURSES VIEW                        #
//#             				       			                              #
//#############################################################################

//######################## Auxiliary functions ################################

//Return the acronym of the name
function getAcronym(universityName){
	var res = "";
	var tokens = universityName.split(" ");
	for(var i = 0; i < tokens.length; i++){
		if(tokens[i][0] != null && tokens[i][0].match(/[A-Z]|-/)){
			res += tokens[i][0];
		}
	}
	return res;
}

function universityToString(u){
	var res = "Percentagem Desemprego: " + u.PercentagemDesemprego + "%";
	//res += "\nTotal Desempregados: " + u.TotalDesempregados;
	//res += "\nTotal Dimplomados: " + u.TotalDiplomados;
	return res;
}

//######################## Visualization Functions #########################

var universityVisObj = new Object();

//Load all the course data
d3.json("CoursesPublic.json",function (data1) {
	d3.json("CoursesPrivate.json",function (data2) {
		fullPrivateCourseDataset = data2;
	});
	fullPublicCourseDataset = data1;
	activeCourseSubsetDataset = currentCourseDataset = data1;
	generateUniversityVis();
});

//Call to update university (Bertin Matrix) visualization
function updateUniversityVisualization(universityVisObj,selectedItemId,newCollection) {
	var newHeight = newCollection.length * universityVisObj.matrixLineHeight + universityVisObj.padding + 20;
	
	universityVisObj.yscale.domain(newCollection.map(function(d) { return d.key; }))
					.range([universityVisObj.padding + 20,newHeight - universityVisObj.matrixLineHeight]);
	universityVisObj.svg.attr("height",newHeight);
	
	var lines = universityVisObj.svg.selectAll("g.data");
	
	lines.remove();
	
	lines = universityVisObj.svg.selectAll("g.data")
		.data(newCollection).enter().append("g")
		.attr("class","data")
		.attr("y",function(d) {return universityVisObj.yscale(d.key); });
	
	lines.selectAll("circle")
		.data(function(d) { return d.data; }).enter().append("circle")
		.transition().duration(1000)
		.attr("r",function (dy) { return Math.sqrt(universityVisObj.circleScale(dy.PercentagemDesemprego)); })
		.attr("cy",function(dy) { return universityVisObj.yscale(dy.key); })
		.attr("cx",function(dy) { return universityVisObj.xscale(dy.Ano); })
		.select("title").text(function(dy) { return "TODO"; });
	

	//Update yaxis labels
	universityVisObj.svg.selectAll(".yaxis").transition().duration(1000).call(universityVisObj.yaxis);
	universityVisObj.svg.selectAll(".tick").append("title").text(function(d) { return d; });
	
	registerEventsUniversityVis();
}

// Code related to University Visualization creation (Bertin Matrix)
function generateUniversityVis(){
	var matrixLineHeight = 15;
	var width = 400;
	var height = activeCourseSubsetDataset.length * matrixLineHeight + universityVisObj.padding + 20;
	var padding = 20;
	var leftPadding = 50;
	var maximumCircleRadius = 100;	
	var years = [2007,2008,2009,2010,2011,2012,2013,2014,2015];
	
	var svg = d3.select("#universityVis")
				.append("svg")
				.attr("width",width)
				.attr("height",height);
		
	//Scale for the unemployment circles
	var circleScale = d3.scaleLinear().domain([0,100]).range([0,maximumCircleRadius]);
	var xscale = d3.scalePoint().domain(years).range([leftPadding+padding,width - leftPadding]);
	var yscale = d3.scalePoint().domain(activeCourseSubsetDataset.map(function(d) { return d.key; })).range([padding+20,height - matrixLineHeight]);
	
	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale).tickFormat(function(d) { return getAcronym(d); });
	svg.append("g").attr("class","xaxis").attr("transform","translate(0,"+padding+")").call(xaxis);
	svg.append("g").attr("class","yaxis").attr("transform","translate("+leftPadding+",0)").call(yaxis);
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
	activeCourseSubsetDataset.sort(function(d1,d2){
		return d2.MediaDesemprego - d1.MediaDesemprego;
	});
	//Enter/load the data in visualization
	updateUniversityVisualization(universityVisObj,null,activeCourseSubsetDataset);
	
	registerEventsUniversityVis();	
}

/* ########################## Interaction Events ############################# */
function registerEventsUniversityVis(){
	// INTERACTION - 
	universityVisObj.svg.select(".yaxis").selectAll(".tick").on("click",function() {
		var selectedItemId = d3.select(this).select("title").text();
		var newCollection;

		if(universityVisObj.level == 0){
			for(var i = 0 ; i <  currentCourseDataset.length; i++){
				if(currentCourseDataset[i].key === selectedItemId){
					newCollection = currentCourseDataset[i].values;
					break;
				}
			}
		}
		else if(universityVisObj.level == 1){
			for(var i = 0; i <  currentCourseDataset.length; i++){
				if(currentCourseDataset[i].key === universityVisObj.tokenLevel[universityVisObj.level - 1]){
					for(var k = 0; k < currentCourseDataset[i].values.length; k++){
						if(currentCourseDataset[i].values[k].key === selectedItemId){
							newCollection = currentCourseDataset[i].values[k].values;
							break;
						}
					}
				}
			}
		}
		else{
			return;
		}
		activeCourseSubsetDataset = newCollection;
		activeCourseSubsetDataset.sort(function(d1,d2){
				return d2.MediaDesemprego - d1.MediaDesemprego;
		});
		universityVisObj.level++;
		universityVisObj.tokenLevel.push(selectedItemId);
		updateUniversityVisualization(universityVisObj,selectedItemId,activeCourseSubsetDataset);
	});
	
	universityVisObj.svg.select(".yaxis").selectAll(".tick").on("contextmenu",function() {
		//TODO
		alert("TODO"); 
	});
	
	// INTERACTION - Sort Universities Unemployment in Ascending order
	d3.selectAll("#universityAscendingButton")
		.on("click",function() {
			activeCourseSubsetDataset.sort(function(d1,d2){
				return d1.MediaDesemprego - d2.MediaDesemprego;
			});
			updateUniversityVisualization(universityVisObj,null,activeCourseSubsetDataset);	
		});
	
	// INTERACTION - Sort Universities Unemployment in Descending order
	d3.selectAll("#universityDescendingButton")
		.on("click",function() {
			activeCourseSubsetDataset.sort(function(d1,d2){
				return d2.MediaDesemprego - d1.MediaDesemprego;
			});
			updateUniversityVisualization(universityVisObj,null,activeCourseSubsetDataset);	
		});
	
	// INTERACTION - Toggle between public anda private courses dataset
	d3.selectAll("#universityTypeButton")
		.on("click",function() {
			if(universityVisObj.publicUniversities){
				universityVisObj.publicUniversities = false;
				$("#universityTypeButton").text("Public Universities");
				activeCourseSubsetDataset = currentCourseDataset = fullPrivateCourseDataset;
			}
			else{
				universityVisObj.publicUniversities = true;
				$("#universityTypeButton").text("Private Universities");
				activeCourseSubsetDataset = currentCourseDataset = fullPublicCourseDataset;
			}
			activeCourseSubsetDataset.sort(function(d1,d2){
				return d2.MediaDesemprego - d1.MediaDesemprego;
			});
			updateUniversityVisualization(universityVisObj,null,activeCourseSubsetDataset);	
		});
	
}

//#############################################################################
//#             				 		                                      #
//#             				 AREA VIEW                                    #
//#             				       			                              #
//#############################################################################

$("#year").change(function() {
	d3.select("svg").remove();
	var y = $("#year").val();
	drawSunburst(y);
});

drawSunburst("2015");

function drawSunburst(year) {
	var width = 550,
		height = 425,
		radius = (Math.min(width, height) / 2) - 10;

	var formatNumber = d3.format(",d");

	var x = d3.scaleLinear().range([0, 2 * Math.PI]);
	var y = d3.scaleSqrt().range([0, radius]);

	var color = d3.scaleOrdinal(d3.schemeCategory20c);
	var partition = d3.partition();

	var arc = d3.arc()
		.startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
		.endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
		.innerRadius(function(d) { return Math.max(0, y(d.y0)); })
		.outerRadius(function(d) { return Math.max(0, y(d.y1)); });

	var svg = d3.select("#areaVis")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class","col-md-offset-2")
			.append("g")
			.attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

	d3.json("Areas" + year + ".json", function(error, root) {
		if (error) throw error;

		root = d3.hierarchy(root);
		root.sum(function(d) { console.log(d.TotalDesempregados); return d.TotalDesempregados; });
		svg.selectAll("path")
			.data(partition(root).descendants()).enter()
			.append("path")
			.attr("class","sunburst")
			.attr("d", arc)
			.style("fill", function(d) {
				return color((d.children ? d : d.parent).CNAEFNome);
			})
			.on("click", click)
				.append("title")
				.text(function(d) {
					return d.CNAEFNome + "\n" + "Total Desempregados: " + 
							d.TotalDesempregados + "\n" + "Percentagem Desemprego: " + 
							d.PercentagemDesemprego + "%";
				});
	});

	d3.select(self.frameElement).style("height", height + "px");

	function click(d) {
		svg.transition()
			.duration(750)
			.tween("scale", function() {
				var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
					yd = d3.interpolate(y.domain(), [d.y, 1]),
					yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
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
}

//#############################################################################
//#             				 		                                      #
//#             		   COURSE LINE CHART VIEW                             #
//#             				       			                              #
//#############################################################################

generateLineChartVis();

function generateLineChartVis(){
	var height = 200;
	var width = 450;
	var padding = 25;
		
	var years = [2007,2008,2009,2010,2011,2012,2013,2014,2015];

	var svg = d3.select("#lineChartVis")
				.append("svg")
				.attr("width",width)
				.attr("height",height);
				
	var xscale = d3.scalePoint().domain(years).range([padding*2,width - padding]);
	var yscale = d3.scaleLinear().domain([100,0]).range([0,height - padding*2]);
	
	var xaxis = d3.axisBottom().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class","xaxis").attr("transform","translate(0,"+(height - padding*2)+")").call(xaxis);
	svg.append("g").attr("class","yaxis").attr("transform","translate("+padding*2+",0)").call(yaxis);
}

//#############################################################################
//#             				 		                                      #
//#                  COURSE SCATTER PLOT CHART VIEW                           #
//#             				       			                              #
//#############################################################################

function getDotToolTip(d){
	var res = "";
	res += "Faculdade: " + d.NomeFaculdade;
	res += "\nCurso: " + d.NomeCurso;
	res += "\nNota: " + d.Nota;
	return res;
}

//Load the ScatterPlot Courses Data and prepare it to be used in Visualization
d3.json("EntryGrades.json",function (data) {
	fullScatterDataset = data.data;
	generateScatterVis();
});

function generateScatterVis(){
	var height = 200;
	var width = 425;
	var padding = 25;
	var dotRadius = 2;
	
	var svg = d3.select("#courseScatterVis")
				.append("svg")
				.attr("width",width)
				.attr("height",height);
	
	var xscale = d3.scaleLinear().domain([9.5,19]).range([padding*2,width - padding]);
	var yscale = d3.scaleLinear().domain([100,0]).range([0,height - padding*2]);
	
	//Enter the new data
	svg.selectAll("circle")
		.data(fullScatterDataset)
		.enter().append("circle")
			.attr("r",function(d) { 
				if(d.PercentagemDesemprego < 0) { return 0; }
				else { return dotRadius; }
			})
			.attr("cx",function(d) { return xscale(d.Nota/10); })
			.attr("cy",function(d) { return yscale(d.PercentagemDesemprego); })
			.append("title").text(function(d) { return getDotToolTip(d); });;
	//==================
	var xaxis = d3.axisBottom().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("class","xaxis").attr("transform","translate(0,"+(height - padding*2)+")").call(xaxis);
	svg.append("g").attr("class","yaxis").attr("transform","translate("+padding*2+",0)").call(yaxis);
	svg.append("text")
		.attr("x",-padding*5)
		.attr("y",padding/2)
		.attr("transform","rotate(-90)")
        .text("Unemployment %");
	svg.append("text")
		.attr("x",width-padding*6)
		.attr("y",height-padding*1)
        .text("Minimum Entry Grade");
}

//#############################################################################
//#############################################################################
//#############################################################################
//#############################################################################