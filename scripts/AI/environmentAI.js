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
				case 'plantTree': 
					msg.positions.forEach(function(el, i){
						as.go.push(SCG.GO.create("tree", { id: el.id, position: new V2(el.position), stage: 0 } ));
					});
					break;
				case 'remove':
					as.game.goUpdates.addRemovements(msg.ids);
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
					self.plantTree= function(positions){
						self.postMessage({command: 'plantTree', message: { positions: positions } });		
					};
					self.remove= function(ids){
						self.postMessage({command: 'remove', message: { ids, ids } });		
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
					self.initTreeProperties = function(tree){
						tree.maxStageDate = tree.stageChangedDate + self.treesStages[tree.stage].growUpPeriod;
						tree.box = new Box(new V2(tree.position.x - tree.size.x/2, tree.position.y - tree.size.y/2), tree.size);
						tree.removed = false;
						self.treesCounter++;
					}

					self.defaultTreeSize = new V2(25,25);

					self.treesStages = [
						{
							growUpPeriod: 5,
							passable: true,
						},
						{
							growUpPeriod: 5,
							passable: true,
						},
						{
							growUpPeriod: 50,
							passable: false,
							spreadSeeds: {
								period: 5,
								range: 80,
								seedsMaxCount: 6
							}
						},
						{
							growUpPeriod: 5,
							passable: false,
						},
						{
							growUpPeriod: 5,
							passable: false,
						},
						{
							growUpPeriod: 5,
							passable: false,
						}
					];

					self.lastTimeRemovedTreesCleanUp = 1;
					self.treesIndicies = {};

					self.treesCounter = 0;
					//debugger;
					var trees = self.environment.trees;
					var currentTotalDays = self.timer ? self.timer.totalDays : 1;
					for(var i = 0;i<trees.length;i++){
						var tree = trees[i];
						tree.position = new V2(tree.position);
						tree.size = new V2(tree.size);
						tree.stageChangedDate = currentTotalDays;
						self.initTreeProperties(tree);
					}

					self.environment.space.box = new Box(new V2(0,0), new V2(self.environment.space.width, self.environment.space.height));
					self.initialized = true;
					break;
				case 'timerEvent':
					if(!self.initialized){
						break;
					}
					var timer = task.message.timer;

					var currentHundred = parseInt(timer.totalDays/100);
					if(currentHundred > self.lastTimeRemovedTreesCleanUp){
						//debugger;
						self.lastTimeRemovedTreesCleanUp = currentHundred;
						self.environment.trees = self.environment.trees.filter(function(el) { return el.removed == undefined || !el.removed; });
					}
					var trees = self.environment.trees;
					var updates = [];

					self.timer = timer;
					self.treesIndicies = {};
					//debugger;
					
					var seedsPositions = [];

					for(var i = 0;i<trees.length;i++){
						var tree = trees[i];
						self.treesIndicies[tree.id] = i;

						if(tree.removed){
							continue;
						}

						var stage = self.treesStages[tree.stage];

						if(stage.spreadSeeds){
							//debugger;
							if(!tree.spreadSeeds){
								tree.spreadSeeds = {
									nextSpread: timer.totalDays + stage.spreadSeeds.period
								};
							}

							if(timer.totalDays >= tree.spreadSeeds.nextSpread){
								tree.spreadSeeds.nextSpread +=stage.spreadSeeds.period;
								
								var seedsCount = getRandomInt(0, stage.spreadSeeds.seedsMaxCount);

								for(var si = 0;si< seedsCount;si++){
									var seedPosition = 
										new V2(getRandomInt(tree.position.x-stage.spreadSeeds.range/2, tree.position.x+stage.spreadSeeds.range/2),
											   getRandomInt(tree.position.y-stage.spreadSeeds.range/2, tree.position.y+stage.spreadSeeds.range/2));
									if(!self.environment.space.box.isPointInside(seedPosition)){
										continue;
									}

									var seedBox = new Box(new V2(seedPosition.x-self.defaultTreeSize.x/2, seedPosition.y-self.defaultTreeSize.y/2), self.defaultTreeSize);
									if(!seedsPositions.some(function(el){ return el.isIntersectsWithBox(seedBox); })){
										seedsPositions.push(seedBox);	
									}
								}
							}
							
						}

						if(tree.stage < self.treesStages.length-1 && timer.totalDays > tree.maxStageDate){
							//console.log('growed up');
							tree.stage++;
							
							tree.stageChangedDate = tree.maxStageDate;
							tree.maxStageDate = tree.maxStageDate + self.treesStages[tree.stage].growUpPeriod;

							updates.push(self.convertToViewModel(tree));
						}
					}

					var removements = []; 
					
					if(seedsPositions.length > 0){ // seeding
						var goodPositions = seedsPositions.map(function(el) {return true;});
						var waitForRemovement = goodPositions.map(function(el) { return []; });

						for(var j = 0; j<trees.length;j++){
							if(trees[j].removed) { 
								continue;
							}
							
							seedsPositions.forEach(function(el,i){
								if(goodPositions[i]){ //replace old trees
									goodPositions[i] = !trees[j].box.isIntersectsWithBox(el);
									if(!goodPositions[i] && trees[j].stage == self.treesStages.length-1){
										goodPositions[i] = true;
										waitForRemovement[i].push(trees[j].id);
									}
								}
							});

							if(!goodPositions.some(function(el){ return el}))
							{
								break;
							}
						}

						var result = [];
						goodPositions.forEach(function(el,i){
							if(el){
								if(waitForRemovement[i].length > 0){
									waitForRemovement[i].forEach(function(rId, ri){
										if(removements.indexOf(rId) == -1){
											removements.push(rId);
										}
									})
								}

								var newTreePosition = seedsPositions[i].center;
								var newId ="tree" + (++self.treesCounter);
								result.push({position: newTreePosition, id: newId });

								var newTree = {
									id: newId,
									position: newTreePosition,
									stage: 0,
									size: self.defaultTreeSize,
									stageChangedDate: self.timer.totalDays
								};

								self.initTreeProperties(newTree);
								self.environment.trees.push(newTree);
							}
						});

						if(result.length > 0){
							self.plantTree(result);	
						}
					}

					if(updates.length > 0){
						self.updateTrees(updates);
					}

					if(removements.length > 0){ 
						removements.forEach(function(id,i){
							 trees[self.treesIndicies[id]].removed = true;
						});

						self.remove(removements);
					}
					break;
				default:
					break;
			}
		}
	}
}