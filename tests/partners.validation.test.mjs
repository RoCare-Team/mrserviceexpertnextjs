// Run: node --test tests/
// Pure validator tests — no DB, no network, no real OTP.
import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMobile,
  validName,
  validGstin,
  validPincode,
  validateBusiness,
  validateAddress,
  brandKey,
  cleanCustomBrand,
  idList,
  slugify,
  partnerRef,
} from "../src/lib/partners/validation.js";

test("normalizeMobile accepts Indian formats and rejects others", () => {
  assert.equal(normalizeMobile("9876543210"), "9876543210");
  assert.equal(normalizeMobile("+91 98765-43210"), "9876543210");
  assert.equal(normalizeMobile("09876543210"), "9876543210");
  assert.equal(normalizeMobile("919876543210"), "9876543210");
  assert.equal(normalizeMobile("5876543210"), null); // must start 6-9
  assert.equal(normalizeMobile("98765"), null);
  assert.equal(normalizeMobile(null), null);
});

test("validName", () => {
  assert.equal(validName("  Ravi   Kumar ").value, "Ravi Kumar");
  assert.ok(validName("R").error);
  assert.ok(validName("<script>").error);
});

test("GSTIN is optional, format-checked only", () => {
  assert.equal(validGstin("").value, null);
  assert.equal(validGstin("06abcde1234f1z5").value, "06ABCDE1234F1Z5");
  assert.ok(validGstin("06ABCDE1234F1X5").error); // 14th char must be Z
  assert.ok(validGstin("123").error);
});

test("pincode", () => {
  assert.equal(validPincode("122101").value, "122101");
  assert.ok(validPincode("022101").error);
  assert.ok(validPincode("12210").error);
});

test("validateBusiness collects field errors", () => {
  const bad = validateBusiness({ business_type: "x", business_name: "", experience_years: 99, gstin: "bad" });
  assert.deepEqual(Object.keys(bad.errors).sort(), ["business_name", "business_type", "experience_years", "gstin"]);

  const ok = validateBusiness({ business_type: "shop", business_name: "ABC Water", experience_years: "5", show_phone_publicly: true, contact_preference: "both" });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.value.experience_years, 5);
  assert.equal(ok.value.show_phone_publicly, 1);

  const noPref = validateBusiness({ business_type: "shop", business_name: "ABC", show_phone_publicly: true });
  assert.ok(noPref.errors.contact_preference);
});

test("validateAddress", () => {
  const r = validateAddress({ line: "Shop 4, Main Road", state_id: 13, city_id: 316, pincode: "122101" });
  assert.deepEqual(r.errors, {});
  assert.ok(validateAddress({}).errors["address.pincode"]);
});

test("brand de-duplication key ignores case/punctuation", () => {
  assert.equal(brandKey("Blue-Star"), brandKey("blue star"));
  assert.equal(brandKey("A.O. Smith"), brandKey("AO Smith"));
  assert.equal(cleanCustomBrand("  Kent  ").value, "Kent");
  assert.ok(cleanCustomBrand("<b>x</b>").error);
});

test("idList dedupes and rejects junk", () => {
  assert.deepEqual(idList([1, "2", 2]), [1, 2]);
  assert.equal(idList([1, "x"]), null);
  assert.equal(idList("1,2"), null);
  assert.equal(idList([1, 2, 3], 2), null);
});

test("slug + reference", () => {
  assert.equal(slugify("ABC Water Solutions  Gurgaon!"), "abc-water-solutions-gurgaon");
  assert.equal(partnerRef(42), "MSE-P000042");
});
