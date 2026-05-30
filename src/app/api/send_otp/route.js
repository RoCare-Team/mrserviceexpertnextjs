export async function POST(request) {
  const body = await request.json();

  const response = await fetch(
    process.env.NEXT_PUBLIC_API_SEND_OTP,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Token": `${process.env.OTP_TOKEN}`,
      },
      body: JSON.stringify(body),
    }
  );

  return Response.json(await response.json());
}