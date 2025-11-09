apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: {{ component_name }}
  namespace: {{ component_ns }}
  annotations:
    fluxcd.io/automated: "false"
spec:
  releaseName: {{ component_name }}
  interval: 1m
  chart:
   spec:
    chart: {{ charts_dir }}/quorum-node
    sourceRef:
      kind: GitRepository
      name: flux-{{ network.env.type }}
      namespace: flux-{{ network.env.type }}
  values:
    global:
      serviceAccountName: vault-auth
      cluster:
        provider: {{ org.cloud_provider }}
        cloudNativeServices: false
      vault:
        address: {{ vault.url }}
        secretPrefix: data/{{ network.env.type }}{{ org_name }}
        network: quorum
        role: vault-role
        authPath: {{ network.env.type }}{{ org_name }}
        type: {{ vault.type | default("hashicorp") }}
        secretEngine: {{ vault.secret_path | default("secretsv2") }}
      proxy:
        provider: "ambassador"
        externalUrlSuffix: {{ org.external_url_suffix }}
        p2p: {{ validator.p2p.ambassador }}
    tessera:
      enabled: false
    tls:
      enabled: false
