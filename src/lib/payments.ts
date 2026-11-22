import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";

import { api } from "./api";
import { supabase } from "./supabase";

type PaymentSubmissionResponse = {
    submissionId: string;
    status: string;
};

export async function submitPayment(
    input: {
        billId: string;
        amount: number;
        referenceNumber: string;
        paymentDate: string;
    },
    receipt: ImagePicker.ImagePickerAsset,
){
    if(!supabase){
        throw new Error("supabase is not configured.");
    }

    if(!receipt.base64){
        throw new Error("Choose a screenshot first.");
    }

    const { data, error: sessionError } = await supabase.auth.getSession();
    if(sessionError) throw sessionError;

    const user = data.session?.user;
    if(!user) throw new Error("Please sign in again.");

    const filePath = `${user.id}/${Date.now()}.jpg`;

    const { data: uploadFile, error: uploadError} = await supabase.storage
        .from("payment_reference")
        .upload(filePath, decode(receipt.base64), {
            contentType: "image/jpeg",
            upsert: false,
        });

    if(uploadError) throw uploadError;

    return api<PaymentSubmissionResponse>("/api/payment-submissions", {
        method: "POST",
        body: JSON.stringify({
            ...input,
            receiptPath: uploadFile.path,
        }),
    });
}