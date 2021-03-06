// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef CHROME_BROWSER_PRINTING_PDF_NUP_CONVERTER_CLIENT_H_
#define CHROME_BROWSER_PRINTING_PDF_NUP_CONVERTER_CLIENT_H_

#include <map>
#include <memory>

#include "chrome/services/printing/public/mojom/pdf_nup_converter.mojom.h"
#include "content/public/browser/web_contents_user_data.h"
#include "services/service_manager/public/cpp/connector.h"

namespace printing {

// Class to manage print requests and their communication with pdf N-up
// converter service.
// Each N-up conversion request has a separate interface pointer to connect
// with remote service. The request and its printing results are tracked by its
// document cookie.
class PdfNupConverterClient
    : public content::WebContentsUserData<PdfNupConverterClient> {
 public:
  explicit PdfNupConverterClient(content::WebContents* web_contents);
  ~PdfNupConverterClient() override;

  void DoNupPdfConvert(
      int document_cookie,
      uint32_t pages_per_sheet,
      const gfx::Size& page_size,
      const gfx::Rect& printable_area,
      std::vector<base::ReadOnlySharedMemoryRegion> pdf_page_regions,
      mojom::PdfNupConverter::NupPageConvertCallback callback);
  void DoNupPdfDocumentConvert(
      int document_cookie,
      uint32_t pages_per_sheet,
      const gfx::Size& page_size,
      const gfx::Rect& printable_area,
      base::ReadOnlySharedMemoryRegion src_pdf_document,
      mojom::PdfNupConverter::NupDocumentConvertCallback callback);

 private:
  friend class content::WebContentsUserData<PdfNupConverterClient>;
  void OnDidNupPdfDocumentConvert(
      int document_cookie,
      mojom::PdfNupConverter::NupDocumentConvertCallback callback,
      mojom::PdfNupConverter::Status status,
      base::ReadOnlySharedMemoryRegion region);

  // Get the request or create a new one if none exists.
  mojom::PdfNupConverterPtr& GetPdfNupConverterRequest(int cookie);

  // Remove an existing request from |pdf_nup_converter_map_|.
  void RemovePdfNupConverterRequest(int cookie);

  mojom::PdfNupConverterPtr CreatePdfNupConverterRequest();

  std::unique_ptr<service_manager::Connector> connector_;

  // Stores the mapping between document cookies and their corresponding
  // requests.
  std::map<int, mojom::PdfNupConverterPtr> pdf_nup_converter_map_;

  content::WebContents* web_contents_;

  WEB_CONTENTS_USER_DATA_KEY_DECL();

  DISALLOW_COPY_AND_ASSIGN(PdfNupConverterClient);
};

}  // namespace printing

#endif  // CHROME_BROWSER_PRINTING_PDF_NUP_CONVERTER_CLIENT_H_
