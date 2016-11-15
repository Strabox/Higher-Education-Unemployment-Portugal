//########################################
//#       Global Code to all Views       #
//########################################

var universityDataset;

//########################################
//#            University View           #
//########################################

function getUniversityAcronym(universityName){
	var res = "";
	var tokens = universityName.split(" ");
	for(var i = 0; i < tokens.length; i++){
		res += tokens[i][0];
	}
	return res;
}

d3.json("University.json",function (data) {
	//Transforms the original file entries in hierarchical objects.
	universityDataset = d3.nest()
				.key(function(d) { d.Acronym = getUniversityAcronym(d.NomeFaculdade); return d.NomeFaculdade; })
				.entries(data);
						
	universityDataset.sort(function (d1,d2) {
							return d1.key < d2.key;
						});
						
	universityDataset = universityDataset.slice(0,5);
	generateUniversityVis();
});

// Code related to University Visualization (Bertin Matrix)
function generateUniversityVis(){
	var width = 550;
	var height = 275;
	var padding = 20;
	var leftPadding = 40;
	var maximumCircleRadius = 60;
	
	var years = [2007,2008,2009];
	
	var svg = d3.select("#universityVis")
				.append("svg")
				.attr("width",width)
				.attr("height",height);
		
	//Scale for the unemployment circles
	var circleScale = d3.scaleLinear().domain([0,100]).range([0,maximumCircleRadius]);
	var xscale = d3.scalePoint().domain(years).range([leftPadding*2,width - leftPadding]);
	var yscale = d3.scalePoint().domain(universityDataset.map(function(d) { return d.key; })).range([padding*2,height - padding]);
	
	svg.selectAll("g")
		.data(universityDataset)
		.enter().append("g")
			.attr("id",function(d) {return yscale(d.key); })
			.attr("y",function(d) {return yscale(d.key); })
            .each(function (d,i,n) { 
                d3.select(n[i]).selectAll("circle").data(d.values)
                .enter().append("circle")
                        .attr("r",function (d2) {return circleScale(d2.PercentagemDesemprego); })
                        .attr("cy",yscale(d.key))
                        .attr("cx",function(d2) {return xscale(d2.Ano);})
						.append("title")
							.text(function(d2) { 
									var res = "Percentagem Desemprego: " + d2.PercentagemDesemprego + "%";
									res += "\nTotal Desempregados: " + d2.TotalDesempregados;
									res += "\nTotal Dimplomados: " + d2.TotalDiplomados;
									res += "\nAno: " + d2.Ano;
									return res;
								});
                
            });
	
	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("transform","translate(0,"+padding+")").call(xaxis);
	svg.append("g").attr("transform","translate("+leftPadding+",0)").call(yaxis);
	svg.selectAll(".tick").append("title").text(function(d) { return d; });
}

//########################################
//#       University Viewpoint           #
//########################################

//TODO

//########################################
//#       University Viewpoint           #
//########################################

//TODO

//########################################
//#       University Viewpoint           #
//########################################

//TODO