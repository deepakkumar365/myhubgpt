"use client";

import { motion } from "framer-motion";
import React, { useMemo } from "react";
import { ToolInvocation } from "ai";

// Define module types
type ModuleType = "shipment" | "order" | "container" | "booking";

// Define reference number types for each module
interface ReferenceNumbers {
    shipmentNo?: string;
    orderNo?: string;
    containerNo?: string;
    bookingNo?: string;
}

interface SuggestedProps {
    moduleType?: ModuleType;
    referenceNumbers?: ReferenceNumbers;
    onSuggestionClick?: (action: string, toolInvocation: string, moduleType: ModuleType, referenceNumber?: string) => void;
    messageLength?: number;
    toolInvocations?: Array<ToolInvocation> | undefined;
}

export const Suggested = React.memo(({
    moduleType = "shipment",
    referenceNumbers = {},
    onSuggestionClick,
    messageLength = 1,
    toolInvocations = [],
}: SuggestedProps) => {
    // Get the appropriate reference number based on module type
    const getReferenceNumber = () => {
        switch (moduleType) {
            case "shipment":
                return referenceNumbers.shipmentNo;
            case "order":
                return referenceNumbers.orderNo;
            case "container":
                return referenceNumbers.containerNo;
            case "booking":
                return referenceNumbers.bookingNo;
            default:
                return undefined;
        }
    };

    // Define general tracking suggestions for when no messages exist
    const generalTrackingSuggestions = useMemo(() => [
        {
            // title: "Order",
            label: "Track your Order",
            action: "Track your Order?",
            toolInvocation: "trackOrder"
        },
        {
            // title: "Booking",
            label: "Track your Booking",
            action: "Track your Booking?",
            toolInvocation: "trackBooking"
        },
        {
            // title: "Shipment",
            label: "Track your Shipment",
            action: "Track your Shipment?",
            toolInvocation: "trackShipment"
        },
        {
            // title: "Containers",
            label: "Track your Container",
            action: "Track your Container?",
            toolInvocation: "trackContainer"
        },
        {
            // title: "Invoices",
            label: "Get your Invoice",
            action: "Get your Invoice?",
            toolInvocation: "getInvoices"
        },
        {
            // title: "Invoices",
            label: "Booking Yet to Be Approved",
            action: "Booking Yet to Be Approved?",
            toolInvocation: "getYetToBeApprovedBooking"
        }        
    ], []);

    // Define module-specific suggested actions
    const moduleSpecificSuggestions = useMemo(() => {
        const commonActions = [
            {
                label: "Show Documents",
                action: "Show Documents?",
                toolInvocation: "showDocuments"
            },
            {
                label: "Show Comments",
                action: "Show Comments?",
                toolInvocation: "showComments"
            },
            {
                label: "Show Activities",
                action: "Show Tasks?",
                toolInvocation: "showActivities"
            },
            {
                label: "Show Exceptions",
                action: "Show Exceptions?",
                toolInvocation: "showExceptions"
            }
        ];

        // Module-specific actions
        const moduleSpecificActions = {
            shipment: [
                {
                    label: "Show Complete Shipment Details",
                    action: "Show Complete Shipment Details?",
                    toolInvocation: "showShipmentDetails"
                }
            ],
            order: [
                {
                    label: "Show Order Status",
                    action: "Show Order Status?",
                    toolInvocation: "showOrderStatus"
                }
            ],
            container: [
                {
                    label: "Show Container Tracking",
                    action: "Show Container Tracking?",
                    toolInvocation: "showContainerTracking"
                }
            ],
            booking: [
                {
                    label: "Show Complete Booking Details",
                    action: "Show Complete Booking Details?",
                    toolInvocation: "showBookingDetails"
                }
            ]
        };

        return [...commonActions, ...moduleSpecificActions[moduleType]];
    }, [moduleType]);

    // Choose which suggestions to display based on tool invocations
    const suggestedActions = useMemo(() => {
        // First check if toolInvocations has at least one item
        if (toolInvocations.length === 1) {
            // Then check if the tool name matches any of the tracking tools
            const trackingTools = ["trackOrder", "trackShipment", "trackContainer", "trackBooking", "showDocuments", "getDocumentsList", "getCommentsList","getTasksList", "getExceptionList", "shipmentSequence", "bookingSequence"];
            if (trackingTools.includes(toolInvocations[0].toolName)) {
                return moduleSpecificSuggestions;
            }
        }
        // Default to general suggestions
        return generalTrackingSuggestions;
    }, [toolInvocations, generalTrackingSuggestions, moduleSpecificSuggestions]);

    const handleClick = (suggestedAction: typeof suggestedActions[0]) => {
        if (onSuggestionClick) {
            onSuggestionClick(
                suggestedAction.action,
                suggestedAction.toolInvocation,
                moduleType,
                getReferenceNumber()
            );
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {suggestedActions.map((suggestedAction, index) => (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    key={index}
                    className={index > 1 ? "hidden sm:block" : "block"}
                >
                    <button
                        onClick={() => handleClick(suggestedAction)}
                        className="w-full text-left bg-gray-100 text-zinc-800 dark:text-zinc-300 rounded-full px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                    >
                        <span className="text-zinc-500 dark:text-zinc-400">
                            {suggestedAction.label}
                        </span>
                    </button>
                </motion.div>
            ))}
        </div>
    )
}, (prevProps, nextProps) => {
    // Only re-render if these props have changed
    return prevProps.moduleType === nextProps.moduleType &&
        prevProps.messageLength === nextProps.messageLength &&
        JSON.stringify(prevProps.referenceNumbers) === JSON.stringify(nextProps.referenceNumbers);
});

// Add display name for ESLint react/display-name rule
Suggested.displayName = 'Suggested';