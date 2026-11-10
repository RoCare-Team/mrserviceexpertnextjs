"use client";

import { useParams } from "next/navigation";
import JobForm from "../../JobForm";

export default function EditJobPage() {
  const { id } = useParams();
  return <JobForm key={id} jobId={Number(id)} />;
}
