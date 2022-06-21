odoo.define("point_of_sale.AbstractReceiptScreen", function (require) {
  "use strict";

  const { useRef } = owl.hooks;
  const { nextFrame } = require("point_of_sale.utils");
  const PosComponent = require("point_of_sale.PosComponent");
  const Registries = require("point_of_sale.Registries");

  /**
   * This relies on the assumption that there is a reference to
   * `order-receipt` so it is important to declare a `t-ref` to
   * `order-receipt` in the template of the Component that extends
   * this abstract component.
   */
  class AbstractReceiptScreen extends PosComponent {
    constructor() {
      super(...arguments);
      this.orderReceipt = useRef("order-receipt");
    }
    async _printReceipt() {
      if (this.env.pos.proxy.printer) {
        const printResult = await this.env.pos.proxy.printer.print_receipt(
          this.orderReceipt.el.outerHTML
        );
        if (printResult.successful) {
          return true;
        } else {
          const { confirmed } = await this.showPopup("ConfirmPopup", {
            title: printResult.message.title,
            body: "Do you want to print using the web printer?",
          });
          if (confirmed) {
            // We want to call the _printWeb when the popup is fully gone
            // from the screen which happens after the next animation frame.
            await nextFrame();
            return await this._printWeb();
          }
          return false;
        }
      } else {
        return await this._printWeb();
      }
    }

    _generate_chk_invoice(
      filename = "123456",
      text = "Hubo un error de generacion"
    ) {
      let element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
      );
      element.setAttribute("download", filename);

      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);

      return;
    }

    async _printWeb() {
      try {

        debugger;

        console.group("this.env.pos.config");
        // De aqui puedo sacar la info del terminal y demas....
        console.info(this.env.pos.config);
        console.groupEnd();

        console.group("ME SIENTO MAL");
        // De aqui puedo sacar la info de como se contruye el HTML....
        console.log(this.orderReceipt.el.outerHTML)

        // Esto es imporntate revisar
        console.log(this.orderReceipt)
        // .com.__owl__.children[productos.....]
        // _receiptEnv orderlines
        console.groupEnd();

        // console.group("env 2");
        // console.info(this.env.pos);
        // console.groupEnd();

        console.group("DORIMEEEEEEEEEEEE");
        console.info(this.env.pos.get_order());
        console.groupEnd();


        const invoice_scaffold = $(".pos-receipt");

        console.log(invoice_scaffold)
        console.log("Aqui el nodo 5")
        console.log(invoice_scaffold[0].children[5]);

        // window.print();
        //console.log("THIS IS AMAZING!~");
        let filename = `${Math.floor(Math.random() * 2000)}.CHK`;
        let text =
          "EMPLOYEE      193795440|Charama|Criseli|Criseli \n" +
          "DOB           20110428\n" +
          "TIME          12:44:54\n" +
          "ORDERNAME     Caja 1 #13\n" +
          "ORDERMODE     AQUI\n" +
          "ITEM          SUPER| 30.68|   30.68| 1| 0\n" +
          "SUBTOTAL      30.68\n" +
          "TAX           4.91\n" +
          "TOTAL1ITEM    35.59\n" +
          "PAYMENT       EFECTIVO2|35.59|0.00||MMYY";

        // this._generate_chk_invoice(filename, text);

        await this.showPopup("ConfirmPopup", {
            title: this.env._t("Va a imprimir una factura."),
            body: this.env._t(
            "Por favor verifique la factura antes de imprimir. \n" +
            "Este proceso puede ser cancelado si no esta seguro de estar facturando correctamente."
            ),
        });

        return true;

      } catch (err) {
        await this.showPopup("ErrorPopup", {
          title: this.env._t("Printing is not supported on some browsers"),
          body: this.env._t(
            "Printing is not supported on some browsers due to no default printing protocol " +
              "is available. It is possible to print your tickets by making use of an IoT Box."
          ),
        });
        return false;
      }
    }
  }

  Registries.Component.add(AbstractReceiptScreen);

  return AbstractReceiptScreen;
});

