package services

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"
	"unicode"
)

var (
	rtfControlWordPattern  = regexp.MustCompile(`\\[a-zA-Z]+-?\d*\s?`)
	multiWhitespacePattern = regexp.MustCompile(`\s+`)
)

func ExtractDocumentText(documentData []byte, mimeType string) (string, error) {
	normalizedMIME := strings.ToLower(strings.TrimSpace(strings.Split(mimeType, ";")[0]))

	switch {
	case isPlainTextMIME(normalizedMIME):
		return normalizeExtractedText(string(documentData))
	case isPDFMIME(normalizedMIME, documentData):
		return extractPDFText(documentData)
	case isDocxMIME(normalizedMIME, documentData):
		return extractDocxText(documentData)
	case isDocMIME(normalizedMIME, documentData):
		return extractDocText(documentData)
	case isRTFMIME(normalizedMIME, documentData):
		return extractRTFText(documentData)
	case isODTMIME(normalizedMIME, documentData):
		return extractODTText(documentData)
	default:
		if text, err := extractDocxText(documentData); err == nil {
			return text, nil
		}
		if text, err := extractODTText(documentData); err == nil {
			return text, nil
		}
		if looksLikeText(documentData) {
			return normalizeExtractedText(string(documentData))
		}
		return "", fmt.Errorf("unsupported document format: %s", mimeType)
	}
}

func isPlainTextMIME(mimeType string) bool {
	return strings.HasPrefix(mimeType, "text/") ||
		mimeType == "application/json" ||
		mimeType == "application/xml" ||
		mimeType == "application/x-yaml" ||
		mimeType == "application/yaml"
}

func isPDFMIME(mimeType string, payload []byte) bool {
	return mimeType == "application/pdf" || bytes.HasPrefix(payload, []byte("%PDF"))
}

func isDocxMIME(mimeType string, payload []byte) bool {
	if mimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" {
		return true
	}
	return bytes.HasPrefix(payload, []byte("PK")) && zipHasEntry(payload, "word/document.xml")
}

func isDocMIME(mimeType string, payload []byte) bool {
	if mimeType == "application/msword" {
		return true
	}
	return len(payload) >= 8 && bytes.Equal(payload[:8], []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1})
}

func isRTFMIME(mimeType string, payload []byte) bool {
	return mimeType == "application/rtf" || mimeType == "text/rtf" || bytes.HasPrefix(payload, []byte("{\\rtf"))
}

func isODTMIME(mimeType string, payload []byte) bool {
	if mimeType == "application/vnd.oasis.opendocument.text" {
		return true
	}
	return bytes.HasPrefix(payload, []byte("PK")) && zipHasEntry(payload, "content.xml")
}

func zipHasEntry(documentData []byte, filename string) bool {
	reader, err := zip.NewReader(bytes.NewReader(documentData), int64(len(documentData)))
	if err != nil {
		return false
	}

	for _, file := range reader.File {
		if strings.EqualFold(file.Name, filename) {
			return true
		}
	}

	return false
}

func extractPDFText(documentData []byte) (string, error) {
	tempDir, err := os.MkdirTemp("", "doc-pdf-*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory for pdf extraction: %w", err)
	}
	defer os.RemoveAll(tempDir)

	inFile := tempDir + "/input.pdf"
	outFile := tempDir + "/output.txt"

	if err := os.WriteFile(inFile, documentData, 0600); err != nil {
		return "", fmt.Errorf("failed to write temp pdf file: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "pdftotext", "-layout", inFile, outFile)
	if output, err := cmd.CombinedOutput(); err != nil {
		if errors.Is(err, exec.ErrNotFound) {
			return "", errors.New("pdf extraction tool not found: install pdftotext (poppler-utils)")
		}
		return "", fmt.Errorf("pdftotext failed: %v (%s)", err, strings.TrimSpace(string(output)))
	}

	textBytes, err := os.ReadFile(outFile)
	if err != nil {
		return "", fmt.Errorf("failed to read extracted pdf text: %w", err)
	}

	return normalizeExtractedText(string(textBytes))
}

func extractDocxText(documentData []byte) (string, error) {
	xmlText, err := readZipXMLFile(documentData, "word/document.xml")
	if err != nil {
		return "", err
	}
	return extractXMLCharData(xmlText)
}

func extractODTText(documentData []byte) (string, error) {
	xmlText, err := readZipXMLFile(documentData, "content.xml")
	if err != nil {
		return "", err
	}
	return extractXMLCharData(xmlText)
}

func readZipXMLFile(documentData []byte, filename string) ([]byte, error) {
	reader, err := zip.NewReader(bytes.NewReader(documentData), int64(len(documentData)))
	if err != nil {
		return nil, fmt.Errorf("failed to open zip document: %w", err)
	}

	for _, file := range reader.File {
		if !strings.EqualFold(file.Name, filename) {
			continue
		}

		rc, openErr := file.Open()
		if openErr != nil {
			return nil, fmt.Errorf("failed to open %s: %w", filename, openErr)
		}
		defer rc.Close()

		xmlData, readErr := io.ReadAll(rc)
		if readErr != nil {
			return nil, fmt.Errorf("failed to read %s: %w", filename, readErr)
		}
		return xmlData, nil
	}

	return nil, fmt.Errorf("missing %s in document archive", filename)
}

func extractXMLCharData(xmlData []byte) (string, error) {
	decoder := xml.NewDecoder(bytes.NewReader(xmlData))
	parts := make([]string, 0, 256)

	for {
		token, err := decoder.Token()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return "", fmt.Errorf("failed to parse document xml: %w", err)
		}

		charData, ok := token.(xml.CharData)
		if !ok {
			continue
		}

		segment := strings.TrimSpace(string(charData))
		if segment == "" {
			continue
		}
		parts = append(parts, segment)
	}

	return normalizeExtractedText(strings.Join(parts, " "))
}

func extractDocText(documentData []byte) (string, error) {
	tempFile, err := os.CreateTemp("", "doc-*.doc")
	if err != nil {
		return "", fmt.Errorf("failed to create temp doc file: %w", err)
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	if _, err := tempFile.Write(documentData); err != nil {
		return "", fmt.Errorf("failed to write temp doc file: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	antiwordCmd := exec.CommandContext(ctx, "antiword", tempFile.Name())
	antiwordOutput, antiwordErr := antiwordCmd.CombinedOutput()
	if antiwordErr == nil {
		return normalizeExtractedText(string(antiwordOutput))
	}

	tempDir, mkErr := os.MkdirTemp("", "doc-convert-*")
	if mkErr != nil {
		return "", fmt.Errorf("antiword failed (%v) and failed to create conversion temp dir: %w", antiwordErr, mkErr)
	}
	defer os.RemoveAll(tempDir)

	libreCmd := exec.CommandContext(ctx, "libreoffice", "--headless", "--convert-to", "txt", "--outdir", tempDir, tempFile.Name())
	libreOut, libreErr := libreCmd.CombinedOutput()
	if libreErr != nil {
		if errors.Is(antiwordErr, exec.ErrNotFound) && errors.Is(libreErr, exec.ErrNotFound) {
			return "", errors.New("doc extraction tools not found: install antiword or libreoffice")
		}
		return "", fmt.Errorf("doc extraction failed (antiword: %v, libreoffice: %v, output: %s)", antiwordErr, libreErr, strings.TrimSpace(string(libreOut)))
	}

	convertedBytes, readErr := os.ReadFile(tempDir + "/" + strings.TrimSuffix(filepathBase(tempFile.Name()), ".doc") + ".txt")
	if readErr != nil {
		return "", fmt.Errorf("failed to read converted doc text: %w", readErr)
	}

	return normalizeExtractedText(string(convertedBytes))
}

func extractRTFText(documentData []byte) (string, error) {
	raw := string(documentData)
	clean := rtfControlWordPattern.ReplaceAllString(raw, " ")
	clean = strings.ReplaceAll(clean, "{", " ")
	clean = strings.ReplaceAll(clean, "}", " ")
	clean = strings.ReplaceAll(clean, "\\'", " ")
	return normalizeExtractedText(clean)
}

func looksLikeText(payload []byte) bool {
	if len(payload) == 0 {
		return false
	}

	printable := 0
	sampled := payload
	if len(sampled) > 4096 {
		sampled = sampled[:4096]
	}

	for _, b := range sampled {
		r := rune(b)
		if unicode.IsPrint(r) || unicode.IsSpace(r) {
			printable++
		}
	}

	return float64(printable)/float64(len(sampled)) > 0.85
}

func normalizeExtractedText(text string) (string, error) {
	clean := strings.TrimSpace(text)
	clean = multiWhitespacePattern.ReplaceAllString(clean, " ")
	if clean == "" {
		return "", errors.New("document content is empty after extraction")
	}
	return clean, nil
}

func filepathBase(path string) string {
	parts := strings.Split(path, "/")
	if len(parts) == 0 {
		return path
	}
	return parts[len(parts)-1]
}
