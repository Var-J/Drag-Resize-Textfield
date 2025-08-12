import type { Route } from "./+types/home";
import CertificateDesigner from "~/certificate-designer/certificate-designer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Certificate Designer Prototype" },
  ];
}

export default function Home() {
  return <CertificateDesigner />;
}