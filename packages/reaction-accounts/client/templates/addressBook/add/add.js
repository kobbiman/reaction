Template.addressBookAdd.helpers({
  thisAddress: function () {
    let thisAddress = {};
    // admin should receive his account
    let account = ReactionCore.Collections.Accounts.findOne({
      userId: Meteor.userId()
    });
    if (account) {
      if (account.profile) {
        if (account.profile.name) {
          thisAddress.fullName = account.profile.name;
        }
        // if this will be the first address we set defaults here and not display
        // them inside form
        if (account.profile.addressBook) {
          if (account.profile.addressBook.length === 0) {
            thisAddress.isShippingDefault = true;
            thisAddress.isBillingDefault = true;
          }
        }
      }
    }
    if (Session.get("address")) {
      thisAddress.postal = Session.get("address").zipcode;
      thisAddress.country = Session.get("address").countryCode;
      thisAddress.city = Session.get("address").city;
      thisAddress.region = Session.get("address").state;
    }

    return thisAddress;
  },

  hasAddressBookEntries: function () {
    let account = ReactionCore.Collections.Accounts.findOne({
      userId: Meteor.userId()
    });
    if (account) {
      if (account.profile) {
        if (account.profile.addressBook) {
          return account.profile.addressBook.length > 0;
        }
      }
    }

    return false;
  }
});

Template.addressBookAdd.events({
  // "click #cancel-new, form submit": function(event, template) {
  //   console.log(event, template, Template.instance())
  //   return Session.set("addressBookView", "addressBookGrid");
  // },
  // "submit form": function() {
  //   return Session.set("addressBookView", "addressBookGrid");
  // }
});


// this is only used because Template.instance() doesn't work in AutoForm.hooks() below
var theAddressBookAddTemplate = null;
Template.addressBookAdd.onCreated(function() {
  var self = this;
  theAddressBookAddTemplate = self;
});

/**
 * addressBookAddForm form handling
 * @description gets accountId and calls addressBookAdd method
 * @fires "accounts/addressBookAdd" method
 */
AutoForm.hooks({
  addressBookAddForm: {
    onSubmit: function (insertDoc) {
      this.event.preventDefault();
      let addressBook = $(this.template.firstNode).closest(".address-book");

      Meteor.call("accounts/addressBookAdd", insertDoc, (error, result) => {
        if (error) {
          Alerts.toast(`Failed to add address: ${error.message}`, "error");
          this.done(new Error("Failed to add address: ", error));
          return false;
        }
        if (result) {
          this.done();
          addressBook.trigger($.Event("showMainView"));

          // make all steps available immediately
          Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutAddressBook");
          Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutAddressBook");
          Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "coreCheckoutShipping");
          Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "coreCheckoutShipping");
          Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "coreCheckoutShipping");
          Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutReview");
          Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutReview");          
        }
      });
    }
  }
});
