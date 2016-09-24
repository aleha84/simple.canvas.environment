var treeBaseProperties = {
	type: 'tree',
	size: new V2(25,25),
	imgPropertyName: 'tree1',
	stage: 0,
	destSourceSize: new V2(45,45),
	initializer: function(that){
		that.destSourcePosition = new V2(that.stage*45,0);
	},
	internalUpdate: function(now){
		var as = SCG.scenes.activeScene;
		var updatesIndicies = as.game.goUpdates.indicies[this.id];
		if(updatesIndicies && updatesIndicies.length > 0){
			var completeUpdate = {};
			for(var i = 0;i<updatesIndicies.length;i++){
				var update = as.game.goUpdates.updates[updatesIndicies[i]];
				if(!update.processed){
					extend(this, update, true);
					update.processed = true;	
					console.log(this.id+' updated');
				}
			}
		}

		this.destSourcePosition = new V2(this.stage*45,0);	
	}
}