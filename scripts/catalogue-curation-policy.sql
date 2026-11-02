-- VOLTTECH PC-FOCUSED PUBLIC CATALOGUE CURATION — 2026-11-02
-- Recorded from the live database after deploying migrations.
-- The trigger runs AFTER the earlier gaming-catalogue guard (alphabetical order).
-- Manual admin exception: metadata.catalogue_curation_override='include'.
-- Historical exclusions retain metadata.catalogue_curation_original for recovery.
-- This file documents the current state; do not apply blindly twice.

CREATE OR REPLACE FUNCTION public.vt_catalogue_focus_reason(p_category text, p_name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
SELECT CASE
 WHEN p_category='tablets' THEN 'noncore_tablets'
 WHEN coalesce(p_name,'') ~* '(vacuum|air[ -]?fryer|kettle|blender|toaster|hair[ -]?dryer|household|standing (air circulation )?fan|pedestal fan|ceiling fan|coffee (maker|machine)|washing machine|fridge|refrigerator)' THEN 'household'
 WHEN p_category='laptop-accessories'
  AND (p_name ~* '(backpack|sleeve|carry case|carrying case|laptop bag|notebook bag|laptop case|stylus|pen for|pouch|trolley|hand strap|screen protector|tablet cover|cable lock)'
   OR p_name !~* '(dock|charger|ac adapter|power adapter|notebook adapter|laptop stand|notebook stand|cooling pad|cooler|ram|ssd|storage|usb|hdmi|battery)')
 THEN 'noncore_laptop_accessories'
 WHEN p_category='power-protection'
  AND (p_name ~* '(power.?bank|portable.?charger|car.?charger|phone.?charger|battery cartridge|replacement battery|40 ?kva|30 ?kva|20 ?kva|10 ?kva)'
  OR p_name !~* '(\mUPS\M|surge|power strip|extension|multiplug|multi plug|pdu|backup power|inverter|voltage regulator|avr|power socket|power outlet)')
 THEN 'noncore_power'
 WHEN p_category='cables'
  AND p_name !~* '(HDMI|DisplayPort|\mDP\M|DVI|VGA|USB|Type.?C|SATA|PCI.?E|\mEPS\M|\mATX\M|power cord|power cable|\mLAN\M|ethernet|CAT[56]|RJ45|audio|3[.]5|XLR|mic|fan|PWM|ARGB|RGB|molex|network)'
 THEN 'noncore_cables'
 WHEN p_category='adapters'
  AND p_name !~* '(HDMI|DisplayPort|\mDP\M|DVI|VGA|USB|Type.?C|SATA|PCI.?E|\mEPS\M|\mATX\M|ethernet|\mLAN\M|Wi.?Fi|Bluetooth|NVMe|M[.]2|docking|dock|memory card|Thunderbolt|laptop|notebook|monitor|graphics|GPU|Acer Ac Adapter|Dell Ac Adapter|Lenovo Ac Adapter|HP Ac Adapter|ASUS Ac Adapter|MSI Ac Adapter)'
 THEN 'noncore_adapters'
 WHEN p_category='desk-accessories'
  AND p_name !~* '(Thermal Grizzly|ARCTIC|mouse.?pad|mouse.?mat|gaming|microphone|monitor|headset|headphone|stream|webcam|\mCPU\M|\mPC\M|fan|ARGB|RGB|thermal|anti.?static|\mESD\M|screwdriver|cable management|GPU bracket|keyboard|desk mat)'
 THEN 'noncore_desk_accessories'
 WHEN p_category='networking'
  AND (p_name ~* '(\mONT\M|\mSFP\M|\mOLT\M|rack mount|transceiver|\mONU\M)'
   OR p_name !~* '(router|mesh|Wi.?Fi|wireless|access point|ethernet|\mLAN\M|network card|network adapter|switch|repeater|range extender|USB|firewall)')
 THEN 'noncore_networking'
 WHEN p_category='desktops' AND p_name ~* '(media player|embedded|digital signage|Android player|ARM player|fanless player|payment terminal)'
 THEN 'noncore_desktops'
 WHEN p_category='laptops' AND p_name ~* '(hand strap|sleeve|backpack|carrying case)'
 THEN 'noncore_laptop_listing'
 ELSE NULL END
$function$


CREATE OR REPLACE FUNCTION public.vt_guard_pc_focus_catalogue()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE reason text;
BEGIN
  IF coalesce(NEW.metadata->>'catalogue_curation_override','')='include' THEN
    RETURN NEW;
  END IF;
  reason:=public.vt_catalogue_focus_reason(NEW.category_slug,NEW.name);
  IF reason IS NOT NULL THEN
    NEW.metadata:=coalesce(NEW.metadata,'{}'::jsonb);
    IF NOT (NEW.metadata ? 'catalogue_curation_original') THEN
      NEW.metadata:=NEW.metadata || jsonb_build_object(
        'catalogue_curation_original',
        jsonb_build_object(
          'visibility',NEW.visibility,
          'sale_mode',NEW.sale_mode,
          'public_store_eligible',NEW.metadata->'public_store_eligible'
        )
      );
    END IF;
    NEW.metadata:=NEW.metadata || jsonb_build_object(
      'catalogue_curation','pc-hardware-focus-20261102',
      'catalogue_curation_reason',reason,
      'public_store_eligible',false
    );
    NEW.visibility:='private';
    NEW.sale_mode:='hidden';
  END IF;
  RETURN NEW;
END;
$function$


CREATE TRIGGER zz_volttech_pc_focus_guard BEFORE INSERT OR UPDATE ON public.store_products FOR EACH ROW EXECUTE FUNCTION vt_guard_pc_focus_catalogue();
