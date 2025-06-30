export interface Order {
  id: string;
  name: string;
  orderedAt: string;
  image: string;
}


export const ORDERS: Order[] = [
  {
    id: "412093",
    name: "Apple Watch Ultra 2",
    orderedAt: "2024-08-26",
    image: "watch.png",
  },
  {
    id: "539182",
    name: "Apple TV",
    orderedAt: "2024-08-25",
    image: "tv.png",
  },
  {
    id: "281958",
    name: "Apple iPhone 14 Pro",
    orderedAt: "2024-08-24",
    image: "iphone.png",
  },
];

export interface TrackingInformation {
  orderId: string;
  progress: "Shipped" | "Out for Delivery" | "Delivered";
  description: string;
}

export const TRACKING_INFORMATION = [
  {
    orderId: "412093",
    progress: "Shipped",
    description: "Last Updated Today 4:31 PM",
  },
  {
    orderId: "281958",
    progress: "Out for Delivery",
    description: "ETA Today 5:45 PM",
  },
  {
    orderId: "539182",
    progress: "Delivered",
    description: "Front Porch Today 3:16 PM",
  },
];

export const getOrders = () => {
  return ORDERS;
};

export const getTrackingInformation = ({ orderId }: { orderId: string }) => {
  return TRACKING_INFORMATION.find((info) => info.orderId === orderId);
};

export const getShipments = async ({ shipmentNo }: { shipmentNo: string }) => {
  const token = process.env.API_TOKEN;

  if (!token) {
    throw new Error('API_TOKEN is not defined in environment variables');
  }

  if (!shipmentNo) {
    throw new Error('shipmentNo parameter is required');
  }

  try {
    const encodedShipmentNo = encodeURIComponent(`'${shipmentNo}'`);
    const url = `http://siteaxis.myhub.plus/odata/ShipmentList?$filter=ShipmentNo eq ${encodedShipmentNo}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    const responseText = await response.text();
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${response.statusText}\nResponse: ${responseText}`);
      throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
    }

    if (!responseText) {
      throw new Error('Empty response received from server');
    }

    try {
      let data = JSON.parse(responseText);
      return data.value;
    } catch (parseError) {
      console.error('Failed to parse JSON:', { responseText });
      throw new Error(`Invalid JSON response: ${(parseError as Error).message}`);
    }
  } catch (error) {
    console.error('Error in getShipments:', {
      error,
      shipmentNo
    });
    throw error;
  }
}

export const getShipmentsLists = async () => {
  const token = process.env.API_TOKEN;

  if (!token) {
    throw new Error('API_TOKEN is not defined in environment variables');
  }

  try {
    const url = `http://siteaxis.myhub.plus/odata/ShipmentList?$filter=Status eq 'Import Customs Cleared'`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    });

    if (!response) {
      throw new Error('No response received from server');
    }

    const responseText = await response.text();
    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${response.statusText}\nResponse: ${responseText}`);
      throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
    }

    if (!responseText) {
      throw new Error('Empty response received from server');
    }

    try {
      let data = JSON.parse(responseText);

      return data.value;
    } catch (parseError) {
      console.error('Failed to parse JSON:', { responseText });
      throw new Error(`Invalid JSON response: ${(parseError as Error).message}`);
    }
  } catch (error) {
    console.error('Error in getShipments:', {
      error
    });
    throw error;
  }
}