
Template.productDetailMarketplace.replaces("productDetail");

Template.productDetail.events({ // for some strange reason our custom event needs to be speficied on the template that we override. doesn't work with our new template name.
  "click .toggle-product-isActive-link": function (event, template) {
    Alerts.removeSeen();
    let errorMsg = "";
    const self = this;

    const productId = ReactionProduct.selectedProductId();
    let selectedProduct = ReactionCore.Collections.Products.findOne({_id:productId, userId:Meteor.userId()})
    if (Roles.userIsInRole(Meteor.userId(), "admin", ReactionCore.getShopId())) {
      selectedProduct = ReactionCore.Collections.Products.findOne({_id:productId})
    }

    if (!self.title) {
      errorMsg += `${i18next.t("error.isRequired", { field: i18next.t("productDetailEdit.title") })}\n`;
      template.$(".title-edit-input").focus();
    }
    const variants = ReactionProduct.getVariants(self._id);
    for (let variant of variants) {
      let index = _.indexOf(variants, variant);
      if (!variant.title) {
        errorMsg += `${i18next.t("error.variantFieldIsRequired", { field: i18next.t("productVariant.title"), number: index + 1 })}\n`;
      }
      if (!variant.price) {
        errorMsg += `${i18next.t("error.variantFieldIsRequired", { field: i18next.t("productVariant.price"), number: index + 1 })}\n`;
      }
    }
    if( ! /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(selectedProduct.pickupTimeFrom) ) {
      errorMsg += `${i18next.t("productDetail.pickupTimeFromIsRequired", { field: i18next.t("productDetail.pickupTimeFrom") })}\n`;
    }
    if( ! /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(selectedProduct.pickupTimeTo) ) {
      errorMsg += `${i18next.t("productDetail.pickupTimeToIsRequired", { field: i18next.t("productDetail.pickupTimeTo") })}\n`;
    }
    if (errorMsg.length > 0) {
      Alerts.inline(errorMsg, "error", {
        placement: "productManagement",
        i18nKey: "productDetail.errorMsg"
      });
    } else {
      function execMeteorCallActivateProduct() {
        Meteor.call("products/activateProduct", self._id, function (error) {
          if (error) {
            errorMsg = `${i18next.t(error.reason)}\n`;

            return Alerts.inline(errorMsg, "error", {
              placement: "productManagement",
              //id: self._id, // this doesn't work on existing prodcuts?
              i18nKey: "productDetail.errorMsg"
            });
          }
        });
      }
      const pickupDate = moment( selectedProduct.forSaleOnDate );
      const latestOrderDate = moment( selectedProduct.latestOrderDate );

      const lastestOrderDateTooLate = latestOrderDate.format( "YYYY-MM-DD" ) > pickupDate.format( "YYYY-MM-DD" );
      delta = 1000;
      if( pickupDate.format( "YYYY-MM-DD" ) == latestOrderDate.format( "YYYY-MM-DD" ) ) {
        const fromHours = parseInt( selectedProduct.pickupTimeFrom.slice(0, 2) );
        const fromMinutes = parseInt( selectedProduct.pickupTimeFrom.slice(3) );
        delta = ( fromHours * 60 + fromMinutes ) - ( latestOrderDate.hours() * 60 + latestOrderDate.minutes() );
        console.log( "Time difference:", delta, "minutes" );
      }

      if (selectedProduct.isActive) {
        execMeteorCallActivateProduct();
      }
      else if (!moment(selectedProduct.forSaleOnDate).isSame(moment(selectedProduct.latestOrderDate), "day")) {
        //console.log(moment(selectedProduct.forSaleOnDate).toString()+" vs. "+moment(selectedProduct.latestOrderDate).toString());

        Alerts.alert({
          title: i18next.t("productDetail.areYouSure", "Are you sure?"),
          text: i18next.t("productDetail.latestOrderDateNotOnSaleDate", "The latest order date is not on for sale date. Are you sure?"),
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: i18next.t("productDetail.yes", "Yes"),
          cancelButtonText: i18next.t("productDetail.no", "No"),
          closeOnConfirm: true,
          closeOnCancel: true
        },
        function(isConfirm){
          if (isConfirm) {
            execMeteorCallActivateProduct();
          }
        });
      }
      else if ( delta <= 60 || lastestOrderDateTooLate ) {

        Alerts.alert({
          title: i18next.t("productDetail.areYouSure", "Are you sure?"),
          text: i18next.t("productDetail.latestOrderDateNearPickupTime", "The latest order date is very near the pickup time. Are you sure?"),
          type: "warning",
          showCancelButton: true,
          confirmButtonColor: "#DD6B55",
          confirmButtonText: i18next.t("productDetail.yes", "Yes"),
          cancelButtonText: i18next.t("productDetail.no", "No"),
          closeOnConfirm: true,
          closeOnCancel: true
        },
        function(isConfirm){
          if (isConfirm) {
            execMeteorCallActivateProduct();
          }
        });
      }
      else {
        execMeteorCallActivateProduct();
      }

    }
  },
  "click .save-product-link": function (event, template) {
    Alerts.removeSeen();
    Alerts.toast(i18next.t("productDetail.changeSaved", "Product saved"), "info");
    $(".save-product-link").blur();
  },
});

Template.registerHelper("belongsToCurrentUser", function (productId) {
  if (_.isArray(productId) === true) {
    productId = productId[0];
  }

  let productBelongingToCurrUser = ReactionCore.Collections.Products.findOne({_id:productId, userId:Meteor.userId()})
  //console.log("Template.helpers.belongsToCurrentUser() Product ",productId," belongs to ",Meteor.userId(),"?");
  //console.log("Template.helpers.belongsToCurrentUser() productBelongingToCurrUser ",productBelongingToCurrUser);
  return ((productBelongingToCurrUser != null) || ReactionCore.hasAdminAccess());
});

Template.productDetail.helpers({
  "displayProductDetail": (productId) => {
  if (_.isArray(productId) === true) {
    productId = productId[0];
  }

  let product = ReactionCore.Collections.Products.findOne({_id:productId})
  const shopId = ReactionCore.getShopId();

  console.log("displayProductDetail: ", productId, product);
  if (product.userId == Meteor.userId()
          || Roles.userIsInRole(Meteor.userId(), ["admin"], shopId)
          || (product.isActive && product.isVisible)
        ) {
          console.log("yes, display product detail");
          return true;
        }
        else {
          console.log("don't display product detail");
          return false;
        }
  }
});


Template.productDetail.onRendered(function(){
  const productId = ReactionProduct.selectedProductId();
  console.log( "Calling 'products/checkIfExpired' method with productId", productId)
  if( productId ) Meteor.call("products/checkIfExpired", productId);
});

Template.productDetail.onDestroyed(function(){
  console.log("Template productDetail destroyed! showing ReactionProduct: ",ReactionProduct);

  const productId = ReactionProduct.selectedProductId();
  const media = ReactionCore.Collections.Media.findOne({
    "metadata.productId": productId,
    "metadata.priority": 0,
    "metadata.toGrid": 1
  }, { sort: { uploadedAt: 1 } });
  console.log("product media:", media);

  if ($('.product-detail-edit .title-edit-input').val() == ""
      && $('.product-detail-edit.description-edit .description-edit-input').val() == ""
      && media == null) {
    console.log("delete empty product!");
    ReactionCore.Collections.Products.remove({_id: productId});
  }
});
