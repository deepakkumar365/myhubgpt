import { format } from 'date-fns';
import { BookingType } from "@/types/booking";
import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

interface Bookings {
    count: number,
    value: BookingType[]
}

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (comment: string) => void;
    action: 'approve' | 'reject';
    bookingNo: string;
    bookingData?: BookingType;
}

const ActionPopup = ({ isOpen, onClose, onSubmit, action, bookingNo, bookingData }: PopupProps) => {
    const { userInfo } = useAuth();
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasError, setHasError] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        setHasError(false);
        onClose();
    };

    const handleSubmit = async () => {
        if (!comment.trim()) {
            setHasError(true);
            return;
        }
        
        setHasError(false);

        setIsSubmitting(true);

        try {
            const input = [
                {
                    PK: "",
                    EntityRefKey: bookingData?.SHPPK || "",
                    EntitySource: "BKG",
                    EntityRefCode: bookingData?.BookingNo || bookingNo,
                    Comments: comment,
                    CommentsType: 'BAR',
                    Description: "Booking Approve/Reject Comments"
                }
            ];

            const response = await fetch(process.env.NEXT_PUBLIC_FXAPI + 'JobComments/Insert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': userInfo.AuthToken,
                    Accept: 'application/json'
                },
                body: JSON.stringify(input)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            onSubmit(comment);
            setComment('');
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Failed to submit comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">
                    {action === 'approve' ? 'Approve' : 'Reject'} Booking #{bookingNo}
                </h3>
                <p className='mb-4 text-xs text-gray-400'>Approve Booking will approve all the attached orders. Would you like to continue?</p>
                <textarea
                    className={`w-full p-2 border rounded-md mb-4 dark:bg-zinc-700 dark:text-white ${
                        hasError 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-zinc-300 dark:border-zinc-600 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    rows={4}
                    placeholder={`Enter your ${action === 'approve' ? 'approval' : 'rejection'} comments...`}
                    value={comment}
                    onChange={(e) => {
                        setComment(e.target.value);
                        if (hasError && e.target.value.trim()) {
                            setHasError(false);
                        }
                    }}
                />
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-4 py-2 rounded-md text-white ${action === 'approve'
                                ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                                : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                            }`}
                    >
                        {isSubmitting ? 'Submitting...' : (action === 'approve' ? 'Approval' : 'Rejection')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const YetToBeApprovedBooking = ({ dataBooking }: { dataBooking: Bookings }) => {
    const [popupState, setPopupState] = useState<{
        isOpen: boolean;
        action: 'approve' | 'reject';
        bookingNo: string;
        bookingData?: BookingType;
    }>({
        isOpen: false,
        action: 'approve',
        bookingNo: '',
        bookingData: undefined,
    });

    const tableHead = ["#", "Action", "Booking No", "Status", "Origin", "Destination", "Booking Date", "Estimated Delivery"];
    const tableBody = ["BookingNo", "StatusDesc", "OriginName", "Destination", "BookingSubmittedDate", "EstimatedDelivery"];

    const handleActionClick = (action: 'approve' | 'reject', bookingNo: string, bookingData?: BookingType) => {
        setPopupState({
            isOpen: true,
            action,
            bookingNo,
            bookingData,
        });
    };

    const handlePopupClose = () => {
        setPopupState({ ...popupState, isOpen: false });
    };

    const handlePopupSubmit = (comment: string) => {
        // Here you would implement the actual approval/rejection logic


        // Close the popup after submission
        handlePopupClose();

        // You might want to refresh the data or update the UI here
    };

    return (
        <>
            <div className="mb-4">I found <b>{dataBooking.count} Bookings</b> that are yet to be approved. {dataBooking.count > 10 && dataBooking.value.length == 10 ? `Here are the details for the first ${dataBooking.value.length}:` : ""}</div>
            {dataBooking.count === 0 ? <div>If you have any further questions or need additional information, feel free to ask!</div> :
                <div className="overflow-auto rounded-lg w-full max-w-2xl">
                    <table className='min-w-full border-collapse text-sm'>
                        <thead className="bg-zinc-100 dark:bg-zinc-800">
                            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                                {tableHead.map((headItem, headIndex) => (
                                    <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap" key={headIndex}>{headItem}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {dataBooking && dataBooking.count > 0 &&
                                dataBooking.value.map((document: any, documentIndex: number) => (
                                    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-900" key={documentIndex}>
                                        <td className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 whitespace-nowrap">{documentIndex + 1}</td>
                                        <td className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleActionClick('approve', document.BookingNo, document)}
                                                    className="px-2 py-1 bg-green-200 text-green-800 rounded-sm hover:bg-green-600 hover:text-white text-xs"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleActionClick('reject', document.BookingNo, document)}
                                                    className="px-2 py-1 bg-red-200 text-red-800 rounded-sm hover:bg-red-600 hover:text-white text-xs"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                        {tableBody.map((bodyItem, bodyIndex) => (
                                            <td className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 whitespace-nowrap" key={bodyIndex}>
                                                {bodyItem === "BookingSubmittedDate" || bodyItem === "EstimatedDelivery"
                                                    ? document[bodyItem]
                                                        ? format(new Date(document[bodyItem]), 'MMMM d, yyyy')
                                                        : ''
                                                    : document[bodyItem]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            }

            <ActionPopup
                isOpen={popupState.isOpen}
                onClose={handlePopupClose}
                onSubmit={handlePopupSubmit}
                action={popupState.action}
                bookingNo={popupState.bookingNo}
                bookingData={popupState.bookingData}
            />
        </>
    );
}