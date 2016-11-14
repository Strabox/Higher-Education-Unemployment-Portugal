var universityDataset;

d3.json("University.json",function (data) {
	universityDataset = data;
	
	var temp = new Object();
	var a = [];
	for(var i = 0; i < universityDataset.length;i++){
		if(temp[universityDataset[i].CodigoFaculdade] == null){
			var universityNode = new Object();
			universityNode.CodigoFaculdade = universityDataset[i].CodigoFaculdade;
			universityNode.NomeFaculdade = universityDataset[i].NomeFaculdade;
			universityNode.Anos = [];
			temp[universityDataset[i].CodigoFaculdade] = universityNode;
		}
		temp[universityDataset[i].CodigoFaculdade].Anos.push({"Ano":universityDataset[i].Ano,
							"PercentagemDesemprego":universityDataset[i].PercentagemDesemprego,
							"TotalDesempregados":universityDataset[i].TotalDesempregados});
	}

	for (var key in temp) {
		if (!temp.hasOwnProperty(key)) {
			continue;
		}
		a.push(temp[key]);
	}
	
	universityDataset = a.slice(0,4);

	generateUniversityVis();
});

// Code related to University Visualization (Bertin Matrix)
function generateUniversityVis(){
	var width = 550;
	var height = 275;
	var padding = 40;
	var spaceBetweenLines = 40;
	var spaceBetweenCircles = 50;
	var maximumCircleRadius = 60;
	
	var indexMap = new Object();
	var universityIndex = 0;
	
	var years = [2007,2008,2009];
	var universities = [];
	
	var svg = d3.select("#universityVis")
				.append("svg")
				.attr("width",width)
				.attr("height",height);
				
	//Scale for the unemployment circles
	var circleScale = d3.scaleLinear().domain([0,100]).range([0,maximumCircleRadius]);
	var xscale = d3.scalePoint().domain(years).range([padding,width - padding]);
	var yscale = d3.scalePoint().domain(universityDataset.map(function(d) { return d.NomeFaculdade; })).range([padding,height]);
	
	svg.selectAll("g")
	.data(universityDataset)
	.enter().append("g")
			.attr("y",(function(d){return yscale(d.NomeFaculdade); }))
			.attr("height",30)
            .each(function (d,i,n) { 
                d3.select(n[i]).selectAll("circle").data(d.Anos)
                .enter().append("circle")
                        .attr("r",function (d2) {return circleScale(d2.PercentagemDesemprego); })
                        .attr("cy",yscale(d.NomeFaculdade))
                        .attr("cx",function(d2) {return xscale(d2.Ano);});
                
            } );
	
	var xaxis = d3.axisTop().scale(xscale);
	var yaxis = d3.axisLeft().scale(yscale);
	svg.append("g").attr("transform","translate(0,20)").call(xaxis);
	svg.append("g").attr("transform","translate(20,0)").call(yaxis);
	
	
	
	/*
	svg.selectAll("circle")
		.data(universityDataset)
		.enter().append("circle")
			.attr("r",function(d) { return circleScale(d.PercentagemDesemprego); })
			.attr("cy",function(d,i) {  
					var res = padding + universityIndex * spaceBetweenLines;
					if(d.CodigoFaculdade in indexMap){
						res = indexMap[d.CodigoFaculdade];
					}
					else{
						indexMap[d.CodigoFaculdade] = res;
						universityIndex++;							
					}
					return res; 
				})
			.attr("cx",function(d) { return xscale(d.Ano); });
	*/		
}
