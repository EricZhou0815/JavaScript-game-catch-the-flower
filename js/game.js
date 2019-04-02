var game;
function Seed (width, height, range, game) {
    this.step = game.step;
    this.bigger = game.bigger;
    this.x = 24+(width-48)*Math.random();
    this.y = -range*Math.random()+(height-24);
    this.r = 6;
    this.scolor = "green";
    this.ecolor = "red";
    this.exists = true;
    this.timer = 0;
    this.higher = ((this.y+24)/7000)*this.step;
    this.maturer = (1/4000) * this.step;
    this.colorStop = 0;
}
Seed.prototype.draw = function () {
    var r = this.r;
    var x = this.x;
    var y = this.y;
    var colorStop = this.colorStop;
    var ics = 1 - colorStop;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y,r,0,2*Math.PI);
    ctx.closePath();
    var grd = ctx.createRadialGradient(x,y,r,x+(48*ics+0.01),y+(48*ics+0.01),r);
    grd.addColorStop(0,this.scolor);
    grd.addColorStop(1,this.ecolor);
    ctx.fillStyle=grd;
    ctx.stroke();
    ctx.fill();
    ctx.restore();
}
Seed.prototype.growup = function () {
    var timer = this.timer;
    var step = this.step;
    this.draw();
    if (timer*step <= 4 * 1000) {
	var r = this.r;
	var c = this.colorStop;
	this.r = (r+this.bigger>24)? 24: r+this.bigger;
	this.colorStop = (c+this.maturer>1)? 1: c+this.maturer;
    } else if (timer*step <= 7 * 1000) {
    } else if (timer*step <= 14 * 1000) {
	this.y -= this.higher;
    } else {
	this.exists = false;
    }
    this.timer++;
};
function MR (xpos, ypos, src) {
    this.img = new Image();
    this.img.src = src;
    this.x = xpos;
    this.y = ypos;
    this.width = 300;
    this.height = 145;
    this.status = "normal";
    this.direction = "left";
    this.happyTime = 0;
    this.sadTime = 0;
}
MR.prototype.draw = function () {
    var direction = this.direction;
    if (this.happyTime > 0) {
	this.img.src = "img/score-"+direction+".png";
	this.happyTime--;
	if (this.happyTime <= 0) {
	    this.img.src = "img/stand-"+direction+".png";
	}
    } else if (this.sadTime > 0) {
	this.img.src = "img/punish-"+direction+".png";
	this.sadTime--;
	if (this.sadTime <= 0) {
	    this.img.src = "img/stand-"+direction+".png";
	}
    }
    ctx.drawImage(this.img, this.x, this.y);
};
MR.prototype.detectCollision = function() {
    var seeds = game.seeds;
    var d = game.mrx.direction;
    var netL;
    var netR;
    if (d == "left") {
	netL = this.x;
	netR = netL + 50;
    } else {
	netR = this.x+this.width;
	netL = netR - 50;
    }
    var netY = this.y + 80;
    var body = {x:this.x+110, width:80, y:this.y, height:this.height};
    for (let i = seeds.length - 1; i >= 0; i--) {
	if ((seeds[i].x >= netL && seeds[i].x <= netR) && (seeds[i].y <= netY && seeds[i].y >= netY - seeds[i].r)) {
	    game.playerScore++;
	    game.score.play();
	    game.mrx.happyTime = 8;
	    game.mrx.sadTime = 0;
	    seeds.splice(i, 1);
	} else if (this.detectCircRect(seeds[i], body)) {
	    game.playerScore--;
	    game.punish.play();
	    game.mrx.sadTime = 8;
	    game.mrx.happyTime = 0;
	    seeds.splice(i, 1);
	}
    }
};
MR.prototype.detectCircRect = function(Circ, Rect) {
    var isInRect1 = (Circ.x >= Rect.x && Circ.x <= Rect.x+Rect.width) 
	&& (Circ.y >= Rect.y - Circ.r && Circ.y <= Rect.y + Rect.height + Circ.r);
    var isInRect2 = (Circ.x >= Rect.x- Circ.r && Circ.x <= Rect.x + Rect.width + Circ.r)
	&& (Circ.y >= Rect.y && Circ.y <= Rect.y + Rect.height);
    var b1 = Math.pow((Rect.x - Circ.x), 2) + Math.pow((Rect.y - Circ.y), 2) <= Circ.r * Circ.r;
    var b2 = Math.pow((Rect.x + Rect.width - Circ.x), 2) + Math.pow((Rect.y - Circ.y), 2) <= Circ.r * Circ.r;
    var b3 = Math.pow((Rect.x - Circ.x), 2) + Math.pow((Rect.y + Rect.height - Circ.y), 2) <= Circ.r * Circ.r;
    var b4 = Math.pow((Rect.x + Rect.width - Circ.x), 2) + Math.pow((Rect.y + Rect.height - Circ.y), 2) <= Circ.r * Circ.r;
    return (isInRect1 || isInRect2 || b1 || b2 || b3 || b4);
};

function Game(canvas, ctx) {
    this.step = 25;
    this.freq = 1000 / this.step;
    this.seed_mod = 40;
    this.time=0;
    this.bigger = ((24 - 6) / 4000) * this.step;
    this.canvas = canvas;
    this.ctx = ctx;
    this.startX = canvas.width / 2;
    this.startY  = canvas.height - 200;
    this.init = function() {
	this.mrx = new MR(this.startX, this.startY, 'img/stand-left.png');
	this.seeds = new Array;

	this.playerScore = 0;
	this.score = new Audio("sounds/score.mp3");
	this.score.volume = .25;
	this.score.load();

	this.punish = new Audio("sounds/punish.mp3");
	this.punish.volume = .25;
	this.punish.load();

	this.backgroundAudio = new Audio("sounds/forest-night.mp3");
	this.backgroundAudio.loop = true;
	this.backgroundAudio.volume = .25;
	this.backgroundAudio.load();
	this.time = 0;

	this.BG = new Image();
	this.BG.src = 'img/Background.png';
    }
    this.drawBG = function() {
	this.ctx.drawImage(this.BG, 0, 0);
    }
    this.drawScore = function() {
	this.ctx.font = "bold 30px sans-serif";
	this.ctx.fillText("SCORE: "+this.playerScore, canvas.width - 200, 40);
    }
    this.start = function() {
	document.getElementById('game-start').style.display = "none";
	document.getElementById('game-over').style.display = "none";
	this.canvas.focus();
	this.backgroundAudio.play();
	this.intervalID = setInterval(this.draw, this.step);
    }
    this.stop = function () {
	this.backgroundAudio.pause();
	this.backgroundAudio.currentTime = 0;
	clearInterval(this.intervalID);
	this.init();
	document.getElementById('game-over').style.display = "block";
    }
    this.restart = function() {
	this.stop();
	this.start();
    }
    // Main Draw
    this.draw = function() {
	var game = this.game;
	var canvas = game.canvas;
	var ctx = game.ctx;
	var time = game.time;
	var mrx = game.mrx;
	var seeds = game.seeds;
	game.drawBG();
	game.drawScore();
	if (time % game.seed_mod == 0){
//	if (time % 99999999 == 0){
	    seeds.push(new Seed(canvas.width, canvas.height, 60, game));
	}
	for (let i = seeds.length - 1; i >= 0; i--) {
	    seeds[i].growup();
	    if (!seeds[i].exists) {
		seeds.splice(i, 1);
	    }
	}
	mrx.draw();
	mrx.detectCollision();
	this.game.time++;
	if (time >= 7*60*game.freq) {
	    game.stop();
	}
    };
}
function run() {
    // Initialise
    var canvas = document.getElementById('collectGame');
    canvas.focus();
    if (canvas.getContext) {
	ctx = canvas.getContext('2d');
    }
    game = new Game(canvas, ctx);
    game.init();
    canvas.addEventListener('keydown', doKeyDown, true);
    canvas.addEventListener('keyup', doKeyUp, true);
    function doKeyDown(e){
	switch(e.keyCode) {
	case 37: { // Left Arrow
	    var newX = game.mrx.x - 10;
	    game.mrx.x = (newX <= 0)? 0: newX;
	    game.mrx.img.src = "img/run-left.png";
	    game.mrx.direction = "left";
	    break;
	}
	case 38: { // Up Arrow
	    var newY = game.mrx.y - 10;
	    var upBorder = 470 - game.mrx.height;
	    game.mrx.y = (newY <= upBorder)? upBorder: newY;
	    break;
	}
	case 39: { // Right Arrow
	    var newX = game.mrx.x + 10;
	    var eastestX = game.canvas.width-game.mrx.width;
	    game.mrx.x = (newX >= eastestX)? eastestX: newX;
	    game.mrx.img.src = "img/run-right.png";
	    game.mrx.direction = "right";
	    break;
	}
	case 40: { // Down Arrow
	    var newY = game.mrx.y + 10;
	    var southestY = 610-game.mrx.height;
	    game.mrx.y = (newY >= southestY)? southestY: newY;
	    break;
	}
	}
    };
    function doKeyUp (e){
	switch(e.keyCode) {
	case 37: { // Left Arrow
	    game.mrx.img.src = "img/stand-left.png";
	    break;
	}
	case 38: { // Up Arrow
	    break;
	}
	case 39: { // Right Arrow					
	    game.mrx.img.src = "img/stand-right.png";
	    break;
	}
	case 40: { // Down Arrow						
	    break;
	}
	}
    };

}
window.onload=run();
