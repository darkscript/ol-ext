/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @requires 
 */


/**
 * @classdesc
 * Fill style with named pattern
 *
 * @constructor
 * @param {olx.style.FillPatternOption=}  Options
 *	- image {ol.style.Image|undefined} an image pattern, image must be preloaded to draw on first call
 *	- pattern {olx.style.fillPattern} pattern name if no image is passed
 *	- color {ol.color} pattern color
 *	- fill {ol.style.Fill} fill color (background)
 *	- offset {number} pattern offset for hash/dot/circle/cross pattern
 *	- size {number} line size for hash/dot/circle/cross pattern
 *	- spacing {number} spacing for hash/dot/circle/cross pattern
 *	- angle {number|bool} angle for hash pattern / true for 45deg dot/circle/cross
 *	- scale [number} pattern scale 
 * @extends {ol.style.Fill}
 * @implements {ol.structs.IHasChecksum}
 * @api
 */
ol.style.FillPattern = function(options) 
{	if (!options) options = {};

	var pattern;

	var canvas = this.canvas_ = document.createElement('canvas');
	var scale = Number(options.scale)>0 ? Number(options.scale) : 1;
	var ratio = scale*ol.has.DEVICE_PIXEL_RATIO || ol.has.DEVICE_PIXEL_RATIO;

	var ctx = canvas.getContext('2d');

	if (options.image)
	{	options.image.load();
		var img = options.image.getImage();
		if (img.width)
		{	pattern = ctx.createPattern(img, 'repeat');
		}
		else 
		{	var self = this;
			pattern = [0,0,0,0];
			img.onload = function ()
			{	pattern = ctx.createPattern(img, 'repeat');
				self.setColor(pattern);
			}
		}
	}
	else
	{	var pat = this.getPattern_(options);
		canvas.width = Math.round(pat.width *ratio);
		canvas.height = Math.round(pat.height *ratio);
		ctx.beginPath();
		if (options.fill) 
		{	ctx.fillStyle = ol.color.asString(options.fill.getColor());
			ctx.fillRect(0,0, canvas.width, canvas.height);
		}
		ctx.scale(ratio,ratio);
		ctx.lineCap = "round";
		ctx.lineWidth = pat.stroke || 1;

		ctx.fillStyle = ol.color.asString(options.color||"#000");
		ctx.strokeStyle = ol.color.asString(options.color||"#000");
		if (pat.circles) for (var i=0; i<pat.circles.length; i++)
		{	var ci = pat.circles[i]; 
			ctx.beginPath();
			ctx.arc(ci[0], ci[1], ci[2], 0,2*Math.PI);
			if (pat.fill) ctx.fill();
			if (pat.stroke) ctx.stroke();
		}

		if (!pat.repeat) pat.repeat=[[0,0]];

		if (pat.lines) for (var i=0; i<pat.lines.length; i++) for (var r=0; r<pat.repeat.length; r++)
		{	var li = pat.lines[i];
			ctx.beginPath();
			ctx.moveTo(li[0]+pat.repeat[r][0],li[1]+pat.repeat[r][1]);
			for (var k=2; k<li.length; k+=2)
			{	ctx.lineTo(li[k]+pat.repeat[r][0],li[k+1]+pat.repeat[r][1]);
			}
			if (pat.fill) ctx.fill();
			if (pat.stroke) ctx.stroke();
		}
		pattern = ctx.createPattern(canvas, 'repeat');
		if (options.offset)
		{	var offset = options.offset;
			if (typeof(offset) == "number") offset = [offset,offset];
			if (offset instanceof Array) 
			{	var dx = Math.round(Math.abs(offset[0]*ratio));
				var dy = Math.round(Math.abs(offset[1]*ratio));
				var c2 = document.createElement('canvas');
				c2.width = canvas.width + dx;
				c2.height = canvas.height + dy;
				var ctx2 = c2.getContext('2d');
				ctx2.fillStyle = pattern;
				ctx2.fillRect (0,0,c2.width,c2.height);
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.drawImage (c2, dx, dy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
				pattern = ctx.createPattern(canvas, 'repeat');
			}
		}
	}
	
	ol.style.Fill.call (this, { color: pattern });

};
ol.inherits(ol.style.FillPattern, ol.style.Fill);

/** Get canvas used as pattern
*	@return {canvas}
*/
ol.style.FillPattern.prototype.getImage = function()
{	return this.canvas_;
}

/** Get pattern
*	@param {olx.style.FillPatternOption}
*/
ol.style.FillPattern.prototype.getPattern_ = function(options)
{	var pat = ol.style.FillPattern.prototype.patterns[options.pattern] 
		|| ol.style.FillPattern.prototype.patterns.dot;
	var d = Math.round(options.spacing)||10;
	var d2 = Math.round(d/2)+0.5;
	switch (options.pattern)
	{	case 'dot':
		case 'circle':
		{	var size = options.size===0 ? 0 : options.size/2 || 2;
			if (!options.angle)
			{	pat.width = pat.height = d;
				pat.circles = [[ d/2, d/2, size ]]
				if (options.pattern=='circle')
				{	pat.circles = pat.circles.concat([
						[ d/2+d, d/2, size ],
						[ d/2-d, d/2, size ],
						[ d/2, d/2+d, size ],
						[ d/2, d/2-d, size ],
						[ d/2+d, d/2+d, size ],
						[ d/2+d, d/2-d, size ],
						[ d/2-d, d/2+d, size ],
						[ d/2-d, d/2-d, size ] ])
				};
			}
			else
			{	d = pat.width = pat.height = Math.round(d*1.4);
				pat.circles = [[ d/4, d/4, size ], [ 3*d/4, 3*d/4, size ]];
				if (options.pattern=='circle')
				{	pat.circles = pat.circles.concat([
						[ d/4+d, d/4, size ],
						[ d/4, d/4+d, size ],
						[ 3*d/4-d, 3*d/4, size ],
						[ 3*d/4, 3*d/4-d, size ],
						[ d/4+d, d/4+d, size ], 
						[ 3*d/4-d, 3*d/4-d, size ] ]);
				}
			}
			break;
		}
		case 'cross':
		{	// Limit angle to 0 | 45
			if (options.angle) options.angle = 45;
		}
		case 'hatch':
		{	var a = Math.round((options.angle-90)%360);
			if (a>180) a -= 360;
			a *= Math.PI/180;
			var cos = Math.cos(a);
			var sin = Math.sin(a);
			if (Math.abs(sin)<0.0001)
			{	pat.width = pat.height = d;	
				pat.lines = [ [ 0,0.5, d, 0.5 ] ];
				pat.repeat = [ [0,0], [0,d] ];
			}
			else  if (Math.abs(cos)<0.0001)
			{	pat.width = pat.height = d;	
				pat.lines = [ [ 0.5,0, 0.5, d] ];
				pat.repeat = [ [0,0], [d,0] ];
				if (options.pattern=='cross') 
				{	pat.lines.push ([ 0,0.5, d, 0.5 ]);
					pat.repeat.push([0,d]);
				}
			}
			else
			{	var w = pat.width = Math.round(Math.abs(d/sin)) || 1;
				var h = pat.height = Math.round(Math.abs(d/cos)) || 1;
				if (options.pattern=='cross')
				{	pat.lines = [ [-w,-h, 2*w,2*h], [2*w,-h, -w,2*h] ];
					pat.repeat = [ [0,0] ];
				}
				else if (cos*sin>0) 
				{	pat.lines = [ [-w,-h, 2*w,2*h] ];
					pat.repeat = [ [0,0], [w,0], [0,h] ];
				}
				else 
				{	pat.lines = [ [2*w,-h, -w,2*h] ];
					pat.repeat = [ [0,0], [-w,0], [0,h] ];
				}
				
			}
			pat.stroke = options.size===0 ? 0 : options.size||1;
		}
		default: break;
	}
	return pat
}


/** Patterns definitions
	Examples : http://seig.ensg.ign.fr/fichchap.php?NOFICHE=FP31&NOCHEM=CHEMS009&NOLISTE=1&N=8
*/
ol.style.FillPattern.prototype.patterns =
{
	"hatch":
	{	width:5,
		height:5,
		lines:[[0,2.5,5,2.5]],
		stroke:1
	},
	"cross":
	{	width:7,
		height:7,
		lines:[[0,3,10,3],[3,0,3,10]],
		stroke:1
	},
	"dot":
	{	width:8,
		height:8,
		circles:[[5,5,2]],
		stroke:false,
		fill:true,
	},
	"circle":
	{	width:10,
		height:10,
		circles:[[5,5,2]],
		stroke:1,
		fill:false,
	},
	"cemetry":
	{	width:15,
		height:19,
		lines:[[0,3.5,7,3.5],[3.5,0,3.5,10],
			//[7,12.5,14,12.5],[10.5,9,10.5,19]
			],
		stroke:1,
		repeat:[[0,0],[7,9]]
	},
	"sand":
	{	width:20,
		height:20,
		circles:[[1,2,1],[9,3,1],[2,16,1],
				[7,8,1],[6,14,1],[4,19,1],
				[14,2,1],[12,10,1],[14,18,1],
				[18,8,1],[18,14,1]],
		fill:1
	},
	"conglomerate":
	{	width:30,
		height:20,
		circles:[[2,4,1],[17,3,1],[26,18,1],[12,17,1],[5,17,2],[28,11,2]],
		lines:[[7,5, 6,7, 9,9, 11,8, 11,6, 9,5, 7,5], 
			[16,10, 15,13, 16,14, 19,15, 21,13, 22,9, 20,8, 19,8, 16,10], 
			[24,6, 26,7, 27,5, 26,4, 24,4, 24,6]],
		stroke:1,
		angle:45
	},
	"gravel":
	{	width:15,
		height:10,
		circles:[[4,2,1],[5,9,1],[1,7,1]],//[9,9,1],,[15,2,1]],
		lines:[[7,5, 6,6, 7,7, 8,7, 9,7, 10,5, 9,4, 7,5], [11,2, 14,4, 14,1, 12,1, 11,2]],
		stroke:1,
		angle:50
	},
	"brick":
	{	width:18,
		height:16,
		lines:[	[0,1,18,1],[0,10,18,10], [6,1,6,10],[12,10,12,18],[12,0,12,1]],
		stroke:1
	},
	"dolomite":
	{	width:20,
		height:16,
		lines:[[0,1,20,1],[0,9,20,9],[1,9,6,1],[11,9,14,16],[14,0,14.4,1]],
		stroke:1
	},
	"coal":
	{	width:20,
		height:16,
		lines:[[1,5, 7,1, 7,7], [11,10, 12,5, 18,9], [5,10, 2,15, 9,15,], [15,16, 15,13, 20,16], [15,0, 15,2, 20,0]],
		fill:1,
		stroke:1,
		angle:10
	},
	"breccia":
	{	width:20,
		height:16,
		lines:[[1,5, 7,1, 7,7, 1,5], [11,10, 12,5, 18,9, 11,10], [5,10, 2,15, 9,15, 5,10], [15,16, 15,13, 22,18], [15,0, 15,2, 20,0] ],
		stroke:1,
		angle:10
	},
	"clay":
	{	width:20,
		height:20,
		lines:[[0,0, 3,11, 0,20], [11,0, 10,3, 13,13, 11,20], [0,0, 10,3, 20,0], [0,12, 3,11, 13,13, 20,12]],
		stroke:1
	},
	"flooded":
	{	width:15,
		height:10,
		lines:[	[0,1,10,1],[0,6,5,6], [10,6,15,6]],
		stroke:1
	},
	"chaos":
	{	width:40,
		height:40,
		lines:[[40,2, 40,0, 38,0, 40,2], 
			[4,0, 3,2, 2,5, 0,0, 0,3, 2,7, 5,6, 7,7, 8,10, 9,12, 9,13, 9,14, 8,14, 6,15, 2,15, 0,20, 0,22, 2,20, 5,19, 
				8,15, 10,14, 11,12.25, 10,12, 10,10, 12,9, 13,7, 12,6, 13,4, 16,7, 17,4, 20,0, 18,0, 15,3, 14,2, 14,0,
				12,1, 11,0, 10,1, 11,4, 10,7, 9,8, 8,5, 6,4, 5,3, 5,1, 5,0, 4,0],
			[7,1, 7,3, 8,3, 8,2, 7,1], [4,3, 5,5, 4,5, 4,3], [34,5, 33,7, 38,10, 38,8, 36,5, 34,5], 
			[ 27,0, 23,2, 21,8, 30,0, 27,0], 
			[25,8, 26,12, 26,16, 22.71875,15.375, 20,13, 18,15, 17,18, 13,22, 17,21, 19,22, 21,20, 19,18, 22,17, 30,25, 
			26,26, 24,28, 21.75,33.34375, 20,36, 18,40, 20,40, 24,37, 25,32, 27,31, 26,38, 27,37, 30,32, 32,35, 36,37, 
			38,40, 38,39, 40,40, 37,36, 34,32, 37,31, 36,29, 33,27, 34,24, 39,21, 40,21, 40,16, 37,20, 31,22, 32,25, 
			27,20, 29,15, 30,20, 32,20, 34,18, 33,12, 31,11, 29,14, 26,9, 25,8], [39,24, 37,26, 40,28, 39,24], 
			[13,15, 9,19, 14,18, 13,15], [18,23, 14,27, 16,27, 17,25, 20,26, 18,23], 
			[6,24, 2,26, 1,28, 2,30, 5,28, 12,30, 16,32, 18,30, 15,30, 12,28, 9,25, 7,27, 6,24], 
			[29,27, 32,28, 33,31, 30,29, 27,28, 29,27], 
			[5,35, 1,33, 3,36, 13,38, 15,35, 10,36, 5,35]],
		fill:1,
		angle:160
	},
	"grass":
	{	width:27,
		height:22,
		lines: [[0,10.5,13,10.5], [2.5,10,1.5,7], [4.5,10, 4.5,5, 3.5,4 ], [7,10, 7.5,6, 8.5,3], [10,10,11,6]],
		repeat: [[0,0],[14,10]],
		stroke:1
	},
	"swamp":
	{	width:24,
		height:23,
		lines:[ [0,10.5,9.5,10.5], [2.5,10,2.5,7], [4.5,10,4.5,4], [6.5,10,6.5,6], [3,12.5,7,12.5] ],
		repeat: [[0,0],[14,10]],
		stroke:1
	},
	"wave":
	{	width:10,
		height:8,
		lines:[ [0,0, 5,4, 10,0] ],
		stroke:1
	},
	"vine":
	{	width:13,
		height:13,
		lines:[[3,0,3,6],[9,7,9,13]],
		stroke:1.0
	},
	"forest":
	{	width:55,
		height:30,
		circles:[[7,7,3.5],[20,20,1.5],[42,22,3.5],[35,5,1.5]],
		stroke:1
	},
	"scrub":
	{	width:26,
		height:20,
		lines:[ [1,4, 4,8, 6,4] ],
		circles:[[20,13,1.5]],
		stroke:1,
	},
	"tree":
	{	width:30,
		height:30,
		lines:[[7.78,10.61,4.95,10.61,4.95,7.78,3.54,7.78,2.12,6.36,0.71,6.36,0,4.24,0.71,2.12,4.24,0,7.78,0.71,9.19,3.54,7.78,4.95,7.07,7.07,4.95,7.78]],
		repeat: [[3,1],[18,16]],
		stroke:1
	},
	"pine":
	{	width:30,
		height:30,
		lines:[[5.66,11.31,2.83,11.31,2.83,8.49,0,8.49,2.83,0,5.66,8.49,2.83,8.49]],
		repeat:[[3,1],[18,16]],
		stroke:1
	},
	"pines":
	{	width:22,
		height:20,
		lines:[[1,4,3.5,1,6,4],[1,8,3.5,5,6,8],[3.5,1,3.5,11],[12,14.5,14.5,14,17,14.5],[12,18,17,18],[14.5,12,14.5,18]],
		repeat: [[2,1]],
		stroke:1
	},
	"rock":
	{	width:20,
		height:20,
		lines:[	[1,0,1,9],[4,0,4,9],[7,0,7,9], 
				[10,1,19,1],[10,4,19,4],[10,7,19,7],
				[0,11,9,11],[0,14,9,14],[0,17,9,17], 
				[12,10,12,19],[15,10,15,19],[18,10,18,19] ],
		repeat:[[0.5,0.5]],
		stroke:1
	},
	"rocks":
	{	width:20,
		height:20,
		lines:[	[5,0, 3,0, 5,4, 4,6, 0,3, 0,5, 3,6, 5,9, 3.75,10, 2.5,10, 0,9, 0,10, 4,11, 5,14, 4,15, 0,13,
			0,13, 0,13, 0,14, 0,14, 5,16, 5,18, 3,19, 0,19, -0.25,19.9375, 5,20, 10,19, 10,20, 11,20, 12,19,
			14,20, 15,20, 17,19, 20,20, 20,19, 19,16, 20,15, 20,11, 20,10, 19,8, 20,5, 20,0, 19,0, 20,2, 19,4,
			17,4, 16,3, 15,0, 14,0, 15,4, 11,5, 10,4, 11,0, 10,0, 9,4, 6,5, 5,0,],
			[18,5, 19,6, 18,10, 16,10, 14,9, 16,5, 18,5], 
			[5,6, 9,5, 10,6, 10,9, 6,10, 5,6], 
			[14,5, 14,8, 13,9, 12,9, 11,7, 12,5, 14,5], 
			[ 5,11, 8,10, 9,11, 10,14, 6,15, 6,15, 5,11], 
			[13,10, 14,11, 15,14, 15,14, 15,14, 11,15, 10,11, 11,10, 13,10], 
			[15,12, 16,11, 19,11, 19,15, 16,14, 16,14, 15,12], 
			[6,16, 9,15, 10,18, 5,19, 6,16], 
			[10,16, 14,16, 14,18, 13,19, 11,18, 10,16], 
			[15,15, 18,16, 18,18, 16,19, 15,18, 15,15]],
		stroke:1
	},
}


/**
 * @inheritDoc
 * /
ol.style.FillPattern.prototype.getChecksum = function() 
{
	var strokeChecksum = (this.stroke_!==null) ?
		this.stroke_.getChecksum() : '-';
	var fillChecksum = (this.fill_!==null) ?
		this.fill_.getChecksum() : '-';

	var recalculate = (this.checksums_===null) ||
		(strokeChecksum != this.checksums_[1] ||
		fillChecksum != this.checksums_[2] ||
		this.radius_ != this.checksums_[3] ||
		this.form_+"-"+this.glyphs_ != this.checksums_[4]);

	if (recalculate) {
		var checksum = 'c' + strokeChecksum + fillChecksum 
			+ ((this.radius_ !== void 0) ? this.radius_.toString() : '-')
			+ this.form_+"-"+this.glyphs_;
		this.checksums_ = [checksum, strokeChecksum, fillChecksum, this.radius_, this.form_+"-"+this.glyphs_];
	}

	return this.checksums_[0];
};
/**/