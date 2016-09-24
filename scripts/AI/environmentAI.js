var environmentAI = {
	initialize: function(trees){ // just helper to init environment
		SCG.AI.initializeEnvironment({
			space: {
				width: SCG.space.width,
				height: SCG.space.height
			},
			trees: trees
		});
	},
	messagesProcesser: function(wm){ // proccess messages from AI
		if(wm == undefined){
			return;
		}
		if(wm.command){
			var as = SCG.scenes.activeScene;
			var msg = wm.message;
			switch(wm.command){
				case 'updateTrees': 
					as.game.goUpdates.addNew(msg.trees);
					break;
				default:
					break;
			}
		}
	},
	queueProcesser: function queueProcesser(){ // queue processer (on AI side)
		while(queue.length){
			var task = queue.pop();

			switch(task.type){
				case 'start':
					self.processTrees = function(){

					};
					self.updateTrees = function(trees){
						self.postMessage({command: 'updateTrees', message: { trees: trees } });				
					};
					self.convertToViewModel = function(tree){
						return {
							id: tree.id,
							stage: tree.stage,
							processed: false
						};
					}

					self.treesStages = [
						{
							growUpPeriod: 5
						},
						{
							growUpPeriod: 5
						},
						{
							growUpPeriod: 5
						},
						{
							growUpPeriod: 5
						}
					];

					self.treesIndicies = {};

					//debugger;
					var trees = self.environment.trees;
					for(var i = 0;i<trees.length;i++){
						var tree = trees[i];
						tree.position = new V2(tree.position);
						tree.stageChangedDate = 1;
					}

					self.initialized = true;
					break;
				case 'timerEvent':
					if(!self.initialized){
						break;
					}
					var timer = task.message.timer;
					var trees = self.environment.trees;
					var updates = [];
					self.treesIndicies = {};
					//debugger;
					for(var i = 0;i<trees.length;i++){
						var tree = trees[i];
						self.treesIndicies[tree.id] = i;

						var stage = self.treesStages[tree.stage];
						if(tree.stage < self.treesStages.length-1 && (timer.totalDays - tree.stageChangedDate) >= stage.growUpPeriod){
							console.log('growed up');
							tree.stage++;
							
							tree.stageChangedDate = timer.totalDays;

							updates.push(self.convertToViewModel(tree));
						}
					}

					if(updates.length > 0){
						self.updateTrees(updates);
					}
					break;
				default:
					break;
			}
		}
	}
}