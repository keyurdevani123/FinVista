import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      setError(null);
    } catch (error) {
      const isStaleServerActionError =
        typeof error?.message === "string" &&
        (error.message.includes("Failed to find Server Action") ||
          error.message.includes("was not found on the server"));

      if (isStaleServerActionError && typeof window !== "undefined") {
        toast.error("App was updated. Reloading to sync actions...");
        window.location.reload();
        return;
      }

      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
