import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import withAuth from "@/core/withAuth";
import { AUTHENTICATE_UPDATE } from "@/modules/auth/actionConstants";
import {
  getPayment,
  isCompletedPaymentStatus,
  redirectToPostPaymentHome,
  refreshAuthenticatedUser,
} from "@/utils/payment";

function PaymentSuccess() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { payment_id } = router.query;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    let cancelled = false;

    const finalizePaymentReturn = async () => {
      if (payment_id) {
        try {
          const paymentResponse = await getPayment(payment_id);
          if (isCompletedPaymentStatus(paymentResponse?.data?.status)) {
            const refreshedUser = await refreshAuthenticatedUser();
            if (!cancelled && refreshedUser) {
              dispatch({
                type: AUTHENTICATE_UPDATE,
                payload: refreshedUser,
              });
            }
          }
        } catch (error) {
          console.error("Failed to finalize payment return", error);
        }
      }

      if (!cancelled) {
        redirectToPostPaymentHome();
      }
    };

    finalizePaymentReturn();

    return () => {
      cancelled = true;
    };
  }, [dispatch, payment_id, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
      }}
    />
  );
}

export default withAuth(PaymentSuccess);
