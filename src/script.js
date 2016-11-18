//###########################################################################
//#       				Global Code to all Views                            #
//###########################################################################

var fullUniversityDataset;	//All the data from the university file
var universityDataset;		//The current data showing in university view

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

/*Calculate and return a unemployment rate to a university
 allowing ordering between universities. */
function getUniversityUnemployment(d){
	var res = 0;
	for(var i = 0;i < d.values.length; i++){
		res += d.values[i].PercentagemDesemprego;
	}
	return res/3;
}

function universityToString(u){
	var res = "Percentagem Desemprego: " + u.PercentagemDesemprego + "%";
	res += "\nTotal Desempregados: " + u.TotalDesempregados;
	res += "\nTotal Dimplomados: " + u.TotalDiplomados;
	return res;
}

//############################ Visualization Functions ######################

//Load the University Data and prepare it to be used in Visualization
d3.json("University.json",function (data) {
	//Transforms the original file entries in hierarchical object good to use in d3.
	fullUniversityDataset = d3.nest()
				.key(function(d) { return d.NomeFaculdade; })
				.entries(data);		
	fullUniversityDataset.sortAscending = function() {
		this.sort(function (d1,d2) {
			return getUniversityUnemployment(d1) - getUniversityUnemployment(d2);
		});
	}
	fullUniversityDataset.sortDescending = function() {
		this.sort(function (d1,d2) {
			return -(getUniversityUnemployment(d1) - getUniversityUnemployment(d2));
		});
	}
		
	//Dirty Trick necessary to easy update in DOM (Talk with Professor)
	var i = 0;			
	for(; i < fullUniversityDataset.length; i++){
		var insideYears = fullUniversityDataset[i].values.map(function(d) { return d.Ano; });
		for(var k = 2007; k <= 2015;k++){
			if(!(k in insideYears)){
				var object = new Object();
				object.Ano = k;
				object.PercentagemDesemprego = 0;
				object.NomeFaculdade = fullUniversityDataset[i].key;
				fullUniversityDataset[i].values.push(object);
			}
		}
	}
	fullUniversityDataset.sortDescending();
	universityDataset = fullUniversityDataset.slice(0,fullUniversityDataset.length);
	generateUniversityVis();
});

//Call to update university (Bertin Matrix) visualization
function updateUniversityVisualization(universityVisObj) {
	universityDataset = fullUniversityDataset.slice(0,fullUniversityDataset.length);
	//Update de yscale domain with the new universities name
	universityVisObj.yscale.domain(universityDataset.map(function(d) { return d.key; }));
	
	//Update to the new data
	var lines = universityVisObj.svg.selectAll("g")
		.data(universityDataset)
		.attr("class","data")
		.attr("y",function(d) { return universityVisObj.yscale(d.key); });
	
	lines.selectAll("circle")
		.data(function(d) { return d.values; },function(dy) { return dy.Ano; })
		.transition().duration(1000)
		.attr("r",function (dy) { return Math.sqrt(universityVisObj.circleScale(dy.PercentagemDesemprego)); })
		.attr("cy",function(dy) { return universityVisObj.yscale(dy.NomeFaculdade); })
		.attr("cx",function(dy) { return universityVisObj.xscale(dy.Ano); })
		.select("title").text(function(dy) { return universityToString(dy); });

	//Update yaxis labels
	universityVisObj.svg.selectAll(".yaxis").transition().duration(1000).call(universityVisObj.yaxis);
	universityVisObj.svg.selectAll(".tick").append("title").text(function(d) { return d; });
}

// Code related to University Visualization creation (Bertin Matrix)
function generateUniversityVis(){
	var width = 600;
	var height = fullUniversityDataset.length*50;
	var padding = 25;
	var leftPadding = 60;
	var maximumCircleRadius = 425;	
	var years = [2007,2008,2009,2010,2011,2012,2013,2014,2015];
	
	var universityVisObj = new Object();
	
	var svg = d3.select("#universityVis")
				.append("svg")
				.attr("width",width)
				.attr("height",height);
		
	//Scale for the unemployment circles
	var circleScale = d3.scaleLinear().domain([0,100]).range([0,maximumCircleRadius]);
	var xscale = d3.scalePoint().domain(years).range([leftPadding+(leftPadding/2),width - leftPadding]);
	var yscale = d3.scalePoint().domain(universityDataset.map(function(d) { return d.key; })).range([padding*2,/*height - padding*/fullUniversityDataset.length*50 ]);
	
	//Enter/load the data in visualization
	var lines = svg.selectAll("g")
		.data(universityDataset)
		.enter().append("g")
			.attr("class","data")
			.attr("y",function(d) {return yscale(d.key); });
			
	lines.selectAll("circle")
		.data(function(d) { return d.values;} )
		.enter().append("circle")
			.attr("r",function (dy) { return Math.sqrt(circleScale(dy.PercentagemDesemprego)); })
			.attr("cy",function(dy) { return yscale(dy.NomeFaculdade);})
			.attr("cx",function(dy) { return xscale(dy.Ano);})
			.append("title").text(function(dy) { return universityToString(dy); });
	//======================================
	
	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale).tickFormat(function(d) { return getUniversityAcronym(d); });
	svg.append("g").attr("class","xaxis").attr("transform","translate(0,"+padding+")").call(xaxis);
	svg.append("g").attr("class","yaxis").attr("transform","translate("+leftPadding+",0)").call(yaxis);
	svg.selectAll(".tick").append("title").text(function(d) { return d; });
	
	universityVisObj.svg = svg;
	universityVisObj.circleScale = circleScale;
	universityVisObj.xscale = xscale;
	universityVisObj.yscale = yscale;
	universityVisObj.yaxis = yaxis;
	
	/* ########################## Interaction Events ############################# */
	
	//INTERACTION - 
	svg.select(".yaxis").selectAll(".tick").on("dblclick",function() {
		alert(d3.select(this).select("title").text());
	});
	
	// INTERACTION - Sort Universities Unemployment in Ascending order
	d3.selectAll("#universityAscending")
	.on("click",function() {
		fullUniversityDataset.sortAscending();
		updateUniversityVisualization(universityVisObj);	
	});
	
	// INTERACTION - Sort Universities Unemployment in Descending order
	d3.selectAll("#universityDescending")
	.on("click",function() {
		fullUniversityDataset.sortDescending();
		updateUniversityVisualization(universityVisObj);	
	});
	
}

//###########################################################################
//#             				 Area View                                  #
//###########################################################################

//TODO

//###########################################################################
//#       					Courses Line Chart View                         #
//###########################################################################

//TODO

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
	var height = 265;
	var width = 600;
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