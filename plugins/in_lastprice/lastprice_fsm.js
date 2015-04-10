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

var agentInitialize = module.exports = function(self, id, type){
    var STATE = {
        NONE : 0,
        INIT : 1,
        LOAD : 2,
        WATCH : 3,
        ERROR : 9,
    }
    var ev = [];
    ev[STATE.NONE] = FSM.dummyEvent;
    ev[STATE.INIT] = FSM.makeEvent({
        task:function(ctx){
            ctx.m.update(STATE.LOAD)
        },
    });
    ev[STATE.ERROR] = FSM.makeEvent({
        begin : function(ctx){
            console.log('fsm error');
            ctx.m.update(STATE.WATCH)
        },
    });
    ev[STATE.LOAD] = FSM.makeEvent({
        begin : function(ctx){
            self.load().then(function(){
                ctx.m.update(STATE.WATCH)
            }).catch(function(err){
                console.log(err)
            })
        },
    });
    ev[STATE.WATCH] = FSM.makeEvent({
        task:function(ctx){
            self.procBook()
        },
    });
    return new Agent(id, ev, STATE.INIT);
}

