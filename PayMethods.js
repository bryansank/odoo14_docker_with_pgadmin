odoo.define("point_of_sale.PayMethods", function (require) {"use strict";
    
    const PosComponent = require("point_of_sale.PosComponent");
    const Registries = require("point_of_sale.Registries");

    class PayMethods extends PosComponent {
        constructor() {
            super(...arguments);
        }

        habla(){
            console.log("HOLA")
        }

    }

    Registries.Component.add(PayMethods);
    return PayMethods;
});  