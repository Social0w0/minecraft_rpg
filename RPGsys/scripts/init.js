import { world } from "@minecraft/server";

world.afterEvents.worldInitialize.subscribe(event => {

    event.itemComponentRegistry.registerDynamicProperties({
        "grade": {
            type: "number"
        }
    });

});
