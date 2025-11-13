{{- define "fabconnect.name" -}}
fabconnect
{{- end -}}

{{- define "fabconnect.fullname" -}}
{{ include "fabconnect.name" . }}-{{ .Release.Name }}
{{- end -}}
