var FSM = require('agent-fsm');
var log = console.log;

var Agent = function(id, ev, state){
    this.id = id;
    this.work = {};
    this.m = FSM.makeStateMachine(this, ev);
    this.m.update(state)
}

Agent.prototype.heartbeat = function(){
    this.m.tick();
}

var Promise = require('bluebird');
var agentInitialize = module.exports = function(self, id, type){
    var STATE = {
        NONE : 0,
        INIT : 1,
        WATCH : 2,
        ACTION : 3,
        ERROR : 9,
    }
    var ev = [];
    ev[STATE.NONE] = FSM.dummyEvent;
    ev[STATE.INIT] = FSM.makeEvent({
        task:function(ctx){
            ctx.m.update(STATE.WATCH)
        },
    });
    ev[STATE.ERROR] = FSM.makeEvent({
        begin : function(ctx){
            console.log('fsm error');
            ctx.m.update(STATE.WATCH)
        },
    });
    ev[STATE.WATCH] = FSM.makeEvent({
        task:function(ctx){
            if(self.checkMarket(type)){
                ctx.m.update(STATE.ACTION)
            }
        },
    });
    ev[STATE.ACTION] = FSM.makeEvent({
        begin:function(ctx){
            self.actionMarket(type).then(function(res){
                ctx.m.update(STATE.WATCH)
            }).catch(function(err){
                ctx.m.update(STATE.ERROR)
            })
        },
    });
    return new Agent(id, ev, STATE.INIT);
}

