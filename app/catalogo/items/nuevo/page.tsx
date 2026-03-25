"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Package, Grid } from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { UserPanel } from "@/components/layout/user-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"

const MAX_TITLE_LENGTH = 60

export default function NuevoItemPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [selectedType, setSelectedType] = useState<"individual" | "variantes" | null>(null)
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null)

  // Validate title - must have actual content (not just spaces)
  const isTituloValid = useMemo(() => {
    return titulo.trim().length > 0
  }, [titulo])

  const breadcrumbs = [
    { label: "Catalogo" },
    { label: "Items", href: "/catalogo/items" },
    { label: "Nuevo Item" },
  ]

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= MAX_TITLE_LENGTH) {
      setTitulo(value)
    }
  }

  const handleTypeSelect = (type: "individual" | "variantes") => {
    if (isTituloValid) {
      setSelectedType(type)
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen">
        <div className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={setHoveredDropdown}
            onDropdownClose={() => setHoveredDropdown(null)}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Header */}
          <div className="relative border-b border-border h-[44px] bg-white z-[100004]">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/catalogo/items")}
                  className="h-8 px-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Breadcrumb items={breadcrumbs} />
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <UserPanel />
              </div>

              <div className="flex items-center gap-2 min-w-[280px] justify-end">
                {/* Future: navigation buttons */}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-auto">
            <div className="flex-1 flex flex-col items-center pt-12 px-8">
              <div className="w-full max-w-xl">
                {/* Title Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="titulo" className="text-sm font-medium text-gray-700">
                      Titulo (obligatorio)
                    </Label>
                    <span className={`text-xs ${titulo.length >= MAX_TITLE_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                      {titulo.length}/{MAX_TITLE_LENGTH}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="titulo"
                      type="text"
                      value={titulo}
                      onChange={handleTituloChange}
                      placeholder="Ingresa el titulo del item..."
                      className="pr-10 h-11"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isTituloValid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          <span className="text-[10px] text-gray-400 font-medium">*</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Type Selection Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Item Individual Card */}
                  <button
                    onClick={() => handleTypeSelect("individual")}
                    disabled={!isTituloValid}
                    className={`
                      relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
                      aspect-[4/5] min-h-[200px]
                      ${!isTituloValid 
                        ? 'border-gray-200 bg-gray-50 opacity-50 blur-[1px] cursor-not-allowed' 
                        : selectedType === 'individual'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-4
                      ${!isTituloValid 
                        ? 'bg-gray-100' 
                        : selectedType === 'individual'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }
                    `}>
                      <Package className={`w-8 h-8 ${!isTituloValid ? 'text-gray-300' : selectedType === 'individual' ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-base font-medium ${!isTituloValid ? 'text-gray-300' : selectedType === 'individual' ? 'text-blue-700' : 'text-gray-700'}`}>
                      Item Individual
                    </span>
                    <span className={`text-xs mt-1 ${!isTituloValid ? 'text-gray-300' : 'text-gray-400'}`}>
                      Un solo producto
                    </span>
                    {selectedType === 'individual' && isTituloValid && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                  </button>

                  {/* Item con Variantes Card */}
                  <button
                    onClick={() => handleTypeSelect("variantes")}
                    disabled={!isTituloValid}
                    className={`
                      relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
                      aspect-[4/5] min-h-[200px]
                      ${!isTituloValid 
                        ? 'border-gray-200 bg-gray-50 opacity-50 blur-[1px] cursor-not-allowed' 
                        : selectedType === 'variantes'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-4
                      ${!isTituloValid 
                        ? 'bg-gray-100' 
                        : selectedType === 'variantes'
                          ? 'bg-purple-100'
                          : 'bg-gray-100'
                      }
                    `}>
                      <Grid className={`w-8 h-8 ${!isTituloValid ? 'text-gray-300' : selectedType === 'variantes' ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-base font-medium ${!isTituloValid ? 'text-gray-300' : selectedType === 'variantes' ? 'text-purple-700' : 'text-gray-700'}`}>
                      Item con Variantes
                    </span>
                    <span className={`text-xs mt-1 ${!isTituloValid ? 'text-gray-300' : 'text-gray-400'}`}>
                      Multiples variaciones
                    </span>
                    {selectedType === 'variantes' && isTituloValid && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
