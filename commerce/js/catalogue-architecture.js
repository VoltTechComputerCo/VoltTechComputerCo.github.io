(function(){
'use strict';

const VT=window.VoltTechStore;
if(!VT||window.__voltTechCatalogueArchitecture)return;
window.__voltTechCatalogueArchitecture=true;

const baseCanAdd=VT.canAdd;
const baseStockLabel=VT.stockLabel;
const baseMediaFor=VT.mediaFor;

function isDemo(product){return !!product?.is_demo}
function previewMode(){return document.body.classList.contains('store-preview')}
function isMediaReviewRequired(product){return !!product?.metadata?.media_review_required}
function isSupplierDataRequired(product){return !!product?.metadata?.supplier_data_required}

function canAdd(product){
  if(isDemo(product)) return false;
  return baseCanAdd(product);
}

function stockLabel(product){
  if(isDemo(product)) return 'Demo fixture · supplier stock not connected';
  return baseStockLabel(product);
}

function mediaFor(product){
  const m=baseMediaFor(product);
  return {
    ...m,
    reviewRequired:isMediaReviewRequired(product),
    demo:isDemo(product)
  };
}

function productAvailability(product){
  if(isDemo(product)){
    return {
      sellable:false,
      label:'Demo catalogue fixture',
      detail:'Reference data only. No supplier stock, price or purchase path is connected.'
    };
  }

  return {
    sellable:canAdd(product),
    label:stockLabel(product),
    detail:'Live supplier availability and delivery are confirmed before payment.'
  };
}

function productIdentity(product){
  const identifiers=product?.identifiers||{};
  const first=(...keys)=>{
    for(const k of keys){
      if(identifiers[k]!=null && String(identifiers[k]).trim()) return String(identifiers[k]).trim();
    }
    return '';
  };

  return {
    brand:product?.brand||'—',
    model:product?.model||'—',
    manufacturer:product?.manufacturer||product?.brand||'—',
    mpn:first('mpn','manufacturerPartNumber','manufacturer_part_number','partNumber','part_number')||'Not assigned',
    sku:first('sku','supplierSku','supplier_sku')||'Not assigned',
    gtin:first('ean','gtin','upc')||'Not assigned',
    condition:product?.condition||'new'
  };
}

function fulfilmentInfo(product){
  return {
    warrantyMonths:product?.warranty_months,
    leadTimeDays:product?.lead_time_days,
    shippingWeightKg:product?.shipping_weight_kg,
    shippingClass:product?.shipping_class,
    dimensions:{
      length:product?.shipping_length_cm,
      width:product?.shipping_width_cm,
      height:product?.shipping_height_cm
    },
    packagingVerified:!!product?.shipping_packaging_verified
  };
}

const baseLoadStore=VT.loadStore;
VT.loadStore=async function(){
  const data=await baseLoadStore();
  window.__vtPreviewProductMap=new Map((data.products||[]).map(p=>[p.id,p]));
  return data;
};

VT.isDemo=isDemo;
VT.previewMode=previewMode;
VT.mediaReviewRequired=isMediaReviewRequired;
VT.supplierDataRequired=isSupplierDataRequired;
VT.canAdd=canAdd;
VT.stockLabel=stockLabel;
VT.mediaFor=mediaFor;
VT.productAvailability=productAvailability;
VT.productIdentity=productIdentity;
VT.fulfilmentInfo=fulfilmentInfo;
})();