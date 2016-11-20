//###########################################################################
//#       				Global Code to all Views                            #
//###########################################################################

var fullUniversityDataset;	//All the data from the university file
var currentCourseDataset;

var fullScatterDataset;		//All the data from the entry grades file

//###########################################################################
//#           				 University View                                #
//###########################################################################

//######################## Auxiliary functions ##############################

//Return the acronym of university name
function getUniversityAcronym(universityName){
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

//############################ Visualization Functions ######################

var universityVisObj = new Object();

//Load the University Data and prepare it to be used in Visualization
d3.json("Courses.json",function (data) {
	fullUniversityDataset = data;
	currentCourseDataset = data;
	generateUniversityVis();
});

//Call to update university (Bertin Matrix) visualization
function updateUniversityVisualization(universityVisObj,selectedItemId,newCollection) {
	var newHeight = newCollection.length * universityVisObj.matrixLineHeight;
	
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
	var width = 375;
	var height = currentCourseDataset.length * matrixLineHeight;
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
	var yscale = d3.scalePoint().domain(currentCourseDataset.map(function(d) { return d.key; })).range([padding+20,height - matrixLineHeight]);
	
	//Enter/load the data in visualization
	var lines = svg.selectAll("g.data")
		.data(currentCourseDataset)
		.enter().append("g")
			.attr("class","data")
			.attr("y",function(d) {return yscale(d.key); });
			
	lines.selectAll("circle")
		.data(function(d) { return d.data;} )
		.enter().append("circle")
			.attr("r",function (dy) { return Math.sqrt(circleScale(dy.PercentagemDesemprego)); })
			.attr("cy",function(dy) { return yscale(dy.key);})
			.attr("cx",function(dy) { return xscale(dy.Ano);})
			.append("title").text(function(dy) { return universityToString(dy); });
	//======================================
	
	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale).tickFormat(function(d) { return getUniversityAcronym(d); });
	svg.append("g").attr("class","xaxis").attr("transform","translate(0,"+padding+")").call(xaxis);
	svg.append("g").attr("class","yaxis").attr("transform","translate("+leftPadding+",0)").call(yaxis);
	svg.selectAll(".tick").append("title").text(function(d) { return d; });
	
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
	
	/* ########################## Interaction Events ############################# */
	
	registerEventsUniversityVis();	
}

function registerEventsUniversityVis(){
	// INTERACTION - 
	universityVisObj.svg.select(".yaxis").selectAll(".tick").on("dblclick",function() {
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
		universityVisObj.level++;
		universityVisObj.tokenLevel.push(selectedItemId);
		updateUniversityVisualization(universityVisObj,selectedItemId,newCollection);
	});
	
	// INTERACTION - Sort Universities Unemployment in Ascending order
	d3.selectAll("#universityAscending")
	.on("click",function() {

		updateUniversityVisualization(universityVisObj);	
	});
	
	// INTERACTION - Sort Universities Unemployment in Descending order
	d3.selectAll("#universityDescending")
	.on("click",function() {

		updateUniversityVisualization(universityVisObj);	
	});
}

//###########################################################################
//#             				 Area View                                  #
//###########################################################################

generateAreaVis();

function generateAreaVis(){
	var height = 350;
	var width = 700;
	
	var svg = d3.select("#areaVis")
				.append("svg")
				.attr("width",width)
				.attr("height",height);
}

//###########################################################################
//#       					Courses Line Chart View                         #
//###########################################################################

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

//###########################################################################
//#      				Courses ScatterPlot View                            #
//###########################################################################

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
	var width = 450;
	var padding = 25;
	var dotRadius = 2;
	
	var svg = d3.select("#courseScatterVis")
				.append("svg")
				.attr("width",width)
				.attr("height",height);
	
	var xscale = d3.scaleLinear().domain([9.5,20]).range([padding*2,width - padding]);
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

//###########################################################################
//###########################################################################
//###########################################################################