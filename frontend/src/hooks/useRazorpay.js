import { useCallback } from 'react';
import { initRazorpayPayment } from '../lib/utils/razorpay';

const useRazorpay = () => {
    const initializePayment = useCallback(async (options, onSuccess, onFailure) => {
        try {
            const rzp = await initRazorpayPayment({
                ...options,
                handler: (response) => {
                    if (onSuccess) onSuccess(response);
                },
                onClose: () => {
                    if (onFailure) {
                        const error = new Error('Payment cancelled');
                        onFailure(error);
                    }
                },
                onError: (error) => {
                    if (onFailure) onFailure(error);
                }
            });
            return rzp;
        } catch (err) {
            if (onFailure) onFailure(err);
            throw err;
        }
    }, []);

    return { initializePayment };
};

export default useRazorpay;

