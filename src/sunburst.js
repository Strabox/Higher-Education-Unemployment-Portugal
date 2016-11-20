$("#year").change(function() {
	d3.select("svg").remove();
	var y = $("#year").val();
	drawSunburst(y);
});

drawSunburst("2015");

function drawSunburst(year) {
	var width = 960,
		height = 700,
		radius = (Math.min(width, height) / 2) - 10;

	var formatNumber = d3.format(",d");

	var x = d3.scale.linear()
		.range([0, 2 * Math.PI]);

	var y = d3.scale.sqrt()
		.range([0, radius]);

	var color = d3.scale.category20c();

	var partition = d3.layout.partition()
		.value(function(d) {
			return d.TotalDesempregados;
		});

	var arc = d3.svg.arc()
		.startAngle(function(d) {
			return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
		})
		.endAngle(function(d) {
			return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
		})
		.innerRadius(function(d) {
			return Math.max(0, y(d.y));
		})
		.outerRadius(function(d) {
			return Math.max(0, y(d.y + d.dy));
		});

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

	d3.json("Areas" + year + ".json", function(error, root) {
		if (error) throw error;

		svg.selectAll("path")
			.data(partition.nodes(root))
			.enter().append("path")
			.attr("d", arc)
			.style("fill", function(d) {
				return color((d.children ? d : d.parent).CNAEFNome);
			})
			.on("click", click)
			.append("title")
			.text(function(d) {
				return d.CNAEFNome + "\n" + "Total Desempregados: " + d.TotalDesempregados + "\n" + "Percentagem Desemprego: " + d.PercentagemDesemprego + "%";
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