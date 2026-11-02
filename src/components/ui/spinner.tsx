import { cn } from "@/lib/utils"

import { ChevronRightIcon, Loader2Icon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon />
  )
}

export { Spinner }
