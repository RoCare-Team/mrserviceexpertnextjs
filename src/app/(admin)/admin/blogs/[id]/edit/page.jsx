import BlogForm from "@/app/(admin)/admin/components/BlogForm";

export default async function EditBlogPage({ params }) {
    const { id } = await params;
  return <BlogForm mode="edit" blogId={id} />;
}