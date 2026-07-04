@@
 <v-col cols="12" sm="9" align-self="start">
@@
+          <!-- ── Card: Mark Email Verified ── -->
+          <v-card flat rounded="lg" class="mb-6 pa-2">
+            <div class="d-flex align-center justify-space-between pa-4 pb-2">
+              <div class="d-flex align-center" style="gap: 6px">
+                <span class="text-subtitle-1 font-weight-medium">Mark Email Verified</span>
+                <v-tooltip text="Mark a user's emailVerified flag to true (admin-only)">
+                  <template #activator="{ props }">
+                    <v-icon v-bind="props" size="16" color="medium-emphasis">mdi-information-outline</v-icon>
+                  </template>
+                </v-tooltip>
+              </div>
+
+              <div class="d-flex align-center" style="gap: 8px">
+                <v-text-field
+                  v-model="verifyUid"
+                  placeholder="Enter user UID"
+                  dense
+                  hide-details
+                  style="width: 360px"
+                />
+                <v-btn
+                  :loading="verifying"
+                  color="primary"
+                  size="small"
+                  variant="tonal"
+                  @click="onSetEmailVerified"
+                >Set Verified</v-btn>
+              </div>
+            </div>
+          </v-card>
+
@@
   setup() {
@@
-    onMounted(() => {
-      if (!filterConfig.value) {
-        store.commit("setFilterConfig", getDefaultConfig());
-      }
-    });
+    onMounted(() => {
+      if (!filterConfig.value) {
+        store.commit("setFilterConfig", getDefaultConfig());
+      }
+    });
+
+    // ── Admin: set emailVerified helper
+    const functions = getFunctions();
+    const verifyUid = ref("");
+    const verifying = ref(false);
+
+    async function onSetEmailVerified() {
+      if (!verifyUid.value) {
+        store.commit("showSnackbar", { text: "Enter a UID first", type: "warning" });
+        return;
+      }
+      verifying.value = true;
+      try {
+        const fn = httpsCallable(functions, "setEmailVerified");
+        const result = await fn({ uid: verifyUid.value });
+        store.commit("showSnackbar", {
+          text: `Marked ${result.data.uid} as emailVerified`,
+          type: "success",
+        });
+        verifyUid.value = "";
+      } catch (err) {
+        store.commit("showSnackbar", {
+          text: `Failed: ${err?.code ?? err?.message ?? err}`,
+          type: "error",
+        });
+      } finally {
+        verifying.value = false;
+      }
+    }
@@
-    return {
+    return {
       // ...existing returned bindings
+      verifyUid,
+      verifying,
+      onSetEmailVerified,
     };
   },
 };
@@
 </script>
