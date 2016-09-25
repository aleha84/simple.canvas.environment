document.addEventListener("DOMContentLoaded", function() {

	SCG.src = {
		tree1: 'content/images/tree1.png',
	}

	var globals = SCG.globals;

	var scene1 = {
		name: "environment",
		space: {
			width: 500,
			height: 300
		},
		dispose: function(){
		},
		start: function(props){ // called each time as scene selected
			var game = this.game;
			var space = this.space;
			var that = this;

			var trees = [];
			if(props && props.trees){
				trees = props.trees;
			}
			else{
				trees = [
					{ position: new V2(100,100), stage: 0 }
				]
			}

			trees.forEach(function(el, i){
				var go = SCG.GO.create("tree", el);
				el.id = go.id;
				el.size = go.size;
				that.go.push(go);
			});

			game.AI.initialize(trees);

			[1,5,10].forEach(function(el, i){
				that.ui.push(SCG.GO.create("button", {
					position: new V2(25+i*50,space.height-15),
					size: new V2(50,30),
					text: {value: el+"x", autoSize:true,font:'Arial'},
					handlers: {
						click: function(){
							game.timer.speed = el;
							game.labels.speed.text.value = el;
							SCG.UI.invalidate();
							return {
								preventBubbling: true
							};
						}
					}
				}));
			});

			var timerLabel = SCG.GO.create("label", { position: new V2(space.width-70,20),size: new V2(50,20), text: { size: 10, value: game.timer.toString(), color: 'blue' } });
			var speedLabel = SCG.GO.create("label", { position: new V2(space.width-20,20),size: new V2(20,20), text: { size: 10, value: 1, color: 'blue', format: "{0}x" } });

			game.labels.timer = timerLabel;
			game.labels.speed = speedLabel;

			this.ui.push(timerLabel);
			this.ui.push(speedLabel);

			SCG.UI.invalidate();

			game.timer.tickTimer = {
				lastTimeWork: new Date,
				delta : 0,
				currentDelay: 0,
				originDelay: 1000,
				doWorkInternal : game.timer.doTick,
				context: game
			}
		},
		backgroundRender: function(){
			var color = 'gray';
			var ctx = SCG.contextBg;
			var viewfield = SCG.viewfield;
			ctx.beginPath();
			ctx.rect(0, 0, viewfield.width, viewfield.height);
			ctx.fillStyle = color;
			ctx.fill()
		},
		preMainWork: function() {
			SCG.context.clearRect(0, 0, SCG.viewfield.width, SCG.viewfield.height);
		},
		afterMainWork: function(){
			var as = this.activeScene;
			doWorkByTimer(as.game.timer.tickTimer, new Date);
		},
		game: {
			goUpdates: {
				indicies: {},
				updates: [],
				addNew: function(goUpdates){
					var unprocessed = this.updates.filter(function(el){ return !el.processed;});
					unprocessed.push.apply(unprocessed, goUpdates);
					this.updates = unprocessed;

					this.indicies = {};
					for(var i = 0;i<unprocessed.length;i++){
						if(this.indicies[unprocessed[i].id])
						{
							this.indicies[unprocessed[i].id].push(i);
						}
						else{
							this.indicies[unprocessed[i].id] = [i];
						}
					}
					console.log('new updates comes:' + goUpdates.length);
				}
			},
			timer: {
				speed: 1,
				years: 0,
				months: 1,
				days: 1,
				totalDays: 1,
				doTick: function(){
					this.timer.addDay();
						
					SCG.AI.sendEvent({ type:'timerEvent', message: { timer: this.timer.clone() } });

					this.labels.timer.text.value = this.timer.toString();
					SCG.UI.invalidate();
				},
				clone: function() {
					return {
						speed: this.speed,
						years: this.years,
						months: this.months,
						days: this.days,
						totalDays: this.totalDays
					}
				},
				addDay: function(){
					var delta = 1*this.speed;
					this.days+=delta;
					this.totalDays+=delta;
					if(this.days > 30){
						this.days-=30;
						this.months++;
					}

					if(this.months>12){
						this.months=1;
						this.years++;
					}
				},
				toString: function(){
					return String.format('{0}y {1}m {2}d', this.years, this.months, this.days);
				}
			},
			labels: {
				timer: undefined,
				speed: undefined
			},
			intervals: [],
			AI: environmentAI
		},
		gameObjectsBaseProperties: [
			treeBaseProperties
		],

	}

	

	SCG.gameControls.camera.resetAfterUpdate = true;

	SCG.scenes.registerScene(scene1);

	SCG.scenes.selectScene(scene1.name);

	SCG.start();
})