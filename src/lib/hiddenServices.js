// Services that exist in the remote all_services.php feed but must not be shown
// on the site (test/dummy entries created in the backend). Remove an entry here
// once it has been deleted from the backend.
const HIDDEN_SERVICE_IDS = ["325"];

const HIDDEN_SERVICE_NAME_PATTERNS = [/only\s*for\s*test/i];

export const isHiddenService = (service) => {
  if (!service) return true;

  if (HIDDEN_SERVICE_IDS.includes(String(service.id))) return true;

  const name = service.service_name || "";
  return HIDDEN_SERVICE_NAME_PATTERNS.some((pattern) => pattern.test(name));
};

export const filterHiddenServices = (services) =>
  Array.isArray(services) ? services.filter((service) => !isHiddenService(service)) : [];
