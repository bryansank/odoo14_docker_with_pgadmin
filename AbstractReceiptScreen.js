
odoo.define("point_of_sale.AbstractReceiptScreen", function (require) {
  "use strict";

  // ==================
  // ==================
  //  V A R I A B L E S    A    M O D I F I C A R
  // ==================
  // ==================

  // TODO: Cuantos decimales dejaremos colocalos.
  const decimals = 2;
  const prod = false;
  // TODO: Pasar esto a un archivo JSON o algo.
  // Aqui en Docker cambiar del tipo 2 en ordern al revez 432
  const TIPOS_DE_PAGO = {
    4:"CASH",
    // 1 y 4 
    1:"EFECTIVO2",
    3:"Tj Debito",
    2:"Tj Credito",
  }

  let flag = true;

  // ==================
  // ==================
  const { useRef } = owl.hooks;
  const { nextFrame } = require("point_of_sale.utils");
  const PosComponent = require("point_of_sale.PosComponent");
  const Registries = require("point_of_sale.Registries");

  class AbstractReceiptScreen extends PosComponent {

    constructor() {
      super(...arguments);
      this.orderReceipt = useRef("order-receipt");
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

    _item_assemble_invoice(itemsValue){

        const items = itemsValue.map(e=>{

          let exempt = "*";
          let namepro = e[2].full_product_name.toString();
          let qty = e[2].qty;
          let priceUnit = e[2].price_unit;
          let amount_qty_total = ((priceUnit * qty).toFixed(decimals)).toString();
          let discount = 0;

          e[2].tax_ids[0][2][0] == 1 ? null : exempt= "";

          // TODO: Ver si validar el 20 o el 60 aqui...
          parseFloat(e[2].discount) == 0 ? null : discount = parseInt(e[2].discount);


          // discount != 0 ? amount_qty_total = (((amount_qty_total * discount) / 100) - amount_qty_total).toFixed(decimals) : null;

          // Descuento en la ultima linea para leerla y crear linea COMP.
          return `${exempt}${namepro}| ${amount_qty_total}|   ${amount_qty_total}| ${qty}| 0|${discount}`;
        });

        return items;
    }

    _assemble_final_invoice(orden){

      debugger;
  
      let textfile = "";
  
      for (let [key, value] of Object.entries(orden)) {
  
        if(key.length != 14 && key.length < 14){
          key = key.padEnd(14, ' ');
        }
  
        if(key.trimEnd() == "ITEM" || key.trimEnd() == "PAYMENT"){
          
          const items = [];
          const items_ConDescuento = value.filter( item => isNaN(parseInt(item.substr(item.length - 2))) != true );
          const items_SinDescuento = value.filter( item => isNaN(parseInt(item.substr(item.length - 2))) != false );
          // logInOdoo(prod,items_ConDescuento);
          // logInOdoo(prod,items_SinDescuento);
          

          // items_SinDescuento.map( i=> { items_ConDescuento.push(i); });
          // items_ConDescuento.map(e=> items.push(e));
          items_ConDescuento.map(it=> items.push(it));
          items_SinDescuento.map(it=> items.push(it));

          // logInOdoo(prod,items);
          
          textfile += items.map((e)=> 
            {//TODO: No se ha definido los complementos.
              return this.calculate_discount_item(key, e);
            }
          );

        }else{
          
          if(key.trimEnd() == "CASH" && value == null)
            { break; }
          else{
            textfile += `${key}${value} \n`;
          }
          
        }
      }
  
      return textfile;
  
    }

    calculate_discount_item(key_value,str_item){
      // Cantidad ya viene sumada al total
      let item_quantity, discount, subtotal, zeroFlag, itemWithoutDiscountValue, item_total_amount, discountAmout, sub_ItemSubTotal;

      discount = parseInt(str_item.substr(str_item.length - 2)); //|0 o 20
      isNaN(discount) ? discount = 0 : null;
      discount == 0 ? zeroFlag =true:zeroFlag =false;
      // item_quantity = str_item.split("/")[3];
      itemWithoutDiscountValue = deleteDiscountOfLineItem(str_item,zeroFlag);
      item_total_amount = str_item.split("|")[1];
      
      discountAmout = ((Number(item_total_amount).toFixed(decimals) * discount) / 100).toFixed(decimals);
      

      
      // TODO: AQUI DEBEN COLOCAR LOS DESCUENTOS....
      if (discount > 0 && discount != 0 && discount == 60 || discount == 20){
        return(
          // Aqui armo el item, comp y el sub total.
          `${key_value}${itemWithoutDiscountValue} \n` +
          "COMP          "+`Descuento ${discount}%|-${discountAmout}\n`
          // "SUBTOTAL      "+`${sub_ItemSubTotal} \n`
        );
      } else if( discount != 0){
        this.errorDiscount = true;
      }else{
        return `${key_value}${itemWithoutDiscountValue}\n`;
      }

    }

    

    async _printReceipt() {

      if(flag){
        flag = false;
      }
      
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
            await this._printWeb_Alterate();

            return true;
            
          }
          return false;
        }

      } else {
        return await this._printWeb_Alterate();
      }
    }

    async _printWeb_Alterate() {
      try {

        this.dummy = "v0.0.0.4";
        logInOdoo(prod, `${this.dummy}`,'background: #222; color: #bada55');

        this.errorDiscount = false;

        this.currentOrderJSON = this.env.pos.get_order().export_as_JSON();
        
        // console.log(this.currentOrderJSON)
        // debugger
        const userSelected = this.env.pos.attributes.selectedClient;
        
        this.employee_id_name = `${this.env.pos.employee.user_id[0]}|${this.env.pos.employee.name}`;
        this.objDate = dateFormat(this.currentOrderJSON);

        this.rest_name = this.env.pos.config.name;

        this.global_tax = this.currentOrderJSON.amount_tax.toFixed(decimals);
        this.paymenst_types = getPaymentTypes(this.currentOrderJSON.statement_ids);


        this.payment_Structure = this.paymenst_types.map(e=>{ 
          return getNameTypePayment(e.idpay) == "CASH" ? 
            `${getNameTypePayment(e.idpay)}|${e.amout}` : 
            `${getNameTypePayment(e.idpay)}|${e.amout}|${this.global_tax}||MMYY`;
        });

        this.subtotal_pay = this.currentOrderJSON.amount_total.toFixed(decimals) - this.currentOrderJSON.amount_tax.toFixed(decimals);


        this.only_cash_payMethod = this.payment_Structure.filter(e=> e.substring(0,4) == "CASH");

        let cash = null;
        this.only_cash_payMethod.length != 0 ? cash = this.only_cash_payMethod[0].substring(5) : null;

        this.payment_Structure = this.payment_Structure.filter(e=> e.substring(0,4) != "CASH");

        this.flagEfectivo = false;
        this.payment_Structure.find(e=> e.substring(0,9) == "EFECTIVO2" ? this.flagEfectivo = true : this.flagEfectivo);


        // Aqui se arman los items.
        this.item_invoice = this._item_assemble_invoice(this.currentOrderJSON.lines);
        const yearMonthDay = `${this.objDate.year}${this.objDate.month}${this.objDate.day}`;
        const yearMonthDayWithSeparators = `${this.objDate.year}-${this.objDate.month}-${this.objDate.day}`;
        this.rateAmount = 1;

        await getRateFromModelRPC(yearMonthDayWithSeparators,this.flagEfectivo, this.env.services).then(
          rateValueAmount => { 
            this.rateAmount = rateValueAmount;
          }, err =>{ console.log(err); debugger }
        );

        if(this.rateAmount == -1){
          await this.showPopup("ConfirmPopup", {
            title: this.env._t("Al parecer no hay una tasa configurada para el dia de hoy."),
            body: this.env._t( "Por favor verifique la tasa y comuniquese con el equipo de soporte tecnico. \n"),
          });
        }

        this.orderBroken = {
          // CLOSED: "TRUE", //TRUE? 
          EMPLOYEE: this.employee_id_name.toString(),
          DOB: yearMonthDay,
          TIME: `${this.objDate.hour}:${this.objDate.minute}:${this.objDate.second}`,
          HEADER: this.rest_name,

          // Aqui va el campo del cliente:
          PIN: userSelected.vat.toString(),
          NAME: userSelected.name.toString(),
          ADDRESS: userSelected.address.toString(),
          PHONE: userSelected.phone.toString(),
          // 

          // ORDERNAME: `Caja #${this.env.pos.pos_session.sequence_number}`,
          // ${this.env.pos.cid}
          // TODO: Format ORDERMODE
          // ORDERMODE: "AQUI",
          USDRATE: this.rateAmount == -1 ? 1 : this.rateAmount,
          // TODO: Agregar tasa aqui
          ITEM: this.item_invoice,
          SUBTOTAL: this.subtotal_pay.toFixed(decimals),
          TAX: this.global_tax,
          TOTAL1ITEM: totalItem(this.subtotal_pay.toFixed(decimals), this.global_tax),
          PAYMENT: this.payment_Structure.map( e=> e),
          CASH: cash != null ? cash : null,
        }

        let fileContent = this._assemble_final_invoice(this.orderBroken);
        fileContent = fileContent.replaceAll(',','');


        // const filename = getRamdonNameCHK(this.objDate.second);
        const filename = `${this.currentOrderJSON.uid.toString()}.CHK`;

        if(!this.errorDiscount){
          // const {confirmed} = await this.showPopup("ConfirmPopup", {
          //   title: this.env._t("Va a imprimir una factura."),
          //   body: this.env._t(
          //   "Por favor verifique la factura antes de imprimir. \n" +
          //   "Este proceso puede ser cancelado si no esta seguro de estar facturando correctamente."
          //   ),
          // });

          // if(true){
            // This is a magic
            this._generate_chk_invoice(filename, fileContent);
            return true;
          // }

        }else{
          await this.showPopup("ConfirmPopup", {
            title: this.env._t("ATENCION -- DESCUENTO NO AUTORIZADO"),
            body: this.env._t(
            "Usted esta intentando ingresar un articulo con un DESCUENTO, NO AUTORIZADO.                    \n" +
            "Verifique nuevamente el pedido y no procese esta factura."
            ),
          });
          
          return false;
        }
        
        // try closed
      } catch (err) {
        await this.showPopup("ErrorPopup", {
          title: this.env._t("Hubo un error inesperado."),
          body: this.env._t(
            `Contactarse con el equipo de soporte, enviar el siguiente error:::: ==> ` + "  " + `${err.message}`
          ),
        });
        return false;
      }
    }
  }

  async function getRateFromModelRPC(dateRate = '2022-05-26', efectvFlag, objRpc){
    if(!efectvFlag){
      return -1;
    }

    let latestRate = -1;
  
    if (!objRpc || !objRpc.rpc) 
      return -1;
    
    let rate;
    return await objRpc.rpc({model:'res.currency.rate', method:'search_read',args:[[['name','=', dateRate ]],['id','name','currency_id','rate']]}).then( 
      dataRateObj => {
        
      rate = dataRateObj;

      if(rate && rate.length != 0){
        rate = rate.filter(d=> d.currency_id[1] == "USD")
        if (rate.length > 0){
            latestRate = rate[0].rate;
        }
      }

      // console.log(latestRate);
      return latestRate.toFixed(4);
      

    }).catch(error => 
      { debugger; logInOdoo(prod,error); return rate = -1}
    );
  }


  function totalItem(totalAmount=0, totalIvaAmount=0){
    if(!isNaN(Number(totalAmount)) || !isNaN(Number(totalIvaAmount))){
      const total = parseFloat(Number(totalAmount)+ Number(totalIvaAmount));
      return total.toFixed(decimals);
    }
    return 0;
  }

  function deleteDiscountOfLineItem(str_item,zeroFlag){
    return zeroFlag ? str_item.slice(0,-2) : str_item.slice(0,-3);
  }

  // function getNameCHK(objOrder){
  //   // param:dateObj
  //   // return `${Math.floor(Math.random() * 2000)}${(dateObj).toString()}.CHK`;
  // }

  function getNameTypePayment(data){
    if(TIPOS_DE_PAGO.hasOwnProperty(data)){
      return TIPOS_DE_PAGO[data];
    }
  }

  function getPaymentTypes(data){
    let payArray = data.map( i => {
      const objPay = {
        amout : i[2].amount.toFixed(decimals),
        idpay : i[2].payment_method_id
      }
      return objPay
    });
    
    return payArray;
    // `${this.currentOrderJSON.statement_ids[0][2].payment_method_id}|${this.currentOrderJSON.amount_total.toFixed(2)}|${this.currentOrderJSON.amount_tax.toFixed(2)}||MMYY`
  }

  // function validateDollarsPaymentMethod(dataPaymentMethods){
  //   return dataPaymentMethods.find(e=>)
  // }

  function dateFormat(data){

    const year = data.creation_date.getFullYear().toString();

    const day = (data.creation_date.getDate().toString().length == 1 ? "0"+(data.creation_date.getDate()).toString() : (data.creation_date.getDate()).toString());
    const month = (data.creation_date.getMonth().toString().length == 1 ? "0"+(data.creation_date.getMonth()+1).toString() : (data.creation_date.getMonth()+1).toString());

    
    const second = (data.creation_date.getSeconds().toString().length == 1 ? "0"+(data.creation_date.getSeconds()+1).toString() : (data.creation_date.getSeconds()+1).toString());

    const minute = (data.creation_date.getMinutes().toString().length == 1 ? "0"+(data.creation_date.getMinutes()).toString() : (data.creation_date.getMinutes()).toString());
    const hour = (data.creation_date.getHours().toString().length == 1 ? "0"+(data.creation_date.getHours()).toString() : (data.creation_date.getHours()).toString());

    return {month,day,year, hour,minute,second};
  }

  function logInOdoo(prod, message, style = 'color: #42f5d4;'){
    prod ? null : console.info("%c"+message, style);
  }

  // Propio del constructor de la clase del archivo.
  Registries.Component.add(AbstractReceiptScreen);

  return AbstractReceiptScreen;
});
// 
// Verify version with DummyVersion variable. (this.dummy)
// 0.0.0.4
//